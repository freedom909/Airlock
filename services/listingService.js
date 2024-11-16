

import { QueryTypes, UUIDV4, literal, Op } from 'sequelize'; // Ensure this is imported
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import { GraphQLError } from 'graphql';
import { GraphQLClient } from 'graphql-request';
//import { shield, allow } from 'graphql-shield';
import { permissions } from '../infrastructure/auth/permission.js';
import ListingRepository from './repositories/listingRepository.js';
import dotenv from 'dotenv';
import connectMysql from './DB/connectMysqlDB.js';
import mysql from 'mysql2/promise';
import sequelize from './models/seq.js';
import queryDatabase from './DB/dbUtils.js'
import Listing from './models/listing.js';
import Amenity from './models/amenity.js';
import Coordinate from './models/location.js'
import dbConfig from './DB/dbconfig.js';
import Location from './models/location.js';
import { query } from 'express';
// import UUIDV4 from 'uuid';


dotenv.config();


class ListingService {
  constructor({ listingRepository, sequelize }) {
    this.listingRepository = listingRepository;
    this.sequelize = sequelize;
    this.graphQLClient = new GraphQLClient('http://localhost:4040/graphql', {
      headers: {
        'Authorization': `Bearer ${process.env.JWT_SECRET}`
      }
    });
  }

  willSendRequest(request) {
    if (this.context && this.context.user) {
      request.headers.set('Authorization', this.context.user.token);
    }
  }

  async getNearbyListings({ latitude, longitude, radius }) {
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);
    console.log("Radius:", radius);
    if (typeof latitude !== "number" || typeof longitude !== "number" || typeof radius !== "number") {
      throw new Error("Invalid latitude, longitude, or radius");
    }

    try {
      const earthRadiusInKm = 6371; // Earth's radius in kilometers

      // Haversine formula to calculate distance
      const query = `
      SELECT 
        listings.id, listings.title, listings.description, listings.costPerNight, listings.hostId, listings.locationId,
        listings.numOfBeds, listings.pictures, listings.isFeatured, listings.saleAmount,
        (
          ${earthRadiusInKm} * ACOS(
            COS(RADIANS(:latitude)) * COS(RADIANS(locations.latitude)) * 
            COS(RADIANS(locations.longitude) - RADIANS(:longitude)) + 
            SIN(RADIANS(:latitude)) * SIN(RADIANS(locations.latitude))
          )
        ) AS distance
      FROM listings
      JOIN locations ON listings.locationId = locations.id
      HAVING distance < :radius
      `;

      const nearbyListings = await this.sequelize.query(query, {
        replacements: { latitude, longitude, radius },
        type: this.sequelize.QueryTypes.SELECT,
      });

      // Map and filter results to ensure complete data structure for GraphQL
      const filteredListings = nearbyListings
        .filter(listing => listing.title) // Ensure listings have titles
        .map(listing => ({
          id: listing.id,
          title: listing.title,
          description: listing.description || "No description available", // Default description if missing
          pictures: listing.pictures || [],
          numOfBeds: listing.numOfBeds || 0,
          costPerNight: listing.costPerNight || 0,
          isFeatured: listing.isFeatured !== null ? listing.isFeatured : false,
          saleAmount: listing.saleAmount || 0,
          checkInDate: listing.checkInDate || "default_check_in_date",
          checkOutDate: listing.checkOutDate || "default_check_out_date",
          distance: listing.distance || 0,
        }));

      // Debugging logs
      console.log('Filtered nearbyListings:', JSON.stringify(filteredListings, null, 2));
      console.log('Type of filteredListings:', Array.isArray(filteredListings) ? 'Array' : typeof filteredListings);

      if (filteredListings.length === 0) {
        throw new Error('No valid listings found with required fields.');
      }

      return filteredListings; // Final return for GraphQL response
    } catch (error) {
      console.error('Error fetching nearby listings:', error);
      throw new Error('Error fetching nearby listings');
    }
  }



  async hotListingsByMoneyBookingTop5() {
    const query = `
    SELECT saleAmount FROM listings ORDER BY saleAmount DESC LIMIT 5
  `;
    const listings = await this.sequelize.query(query, { type: QueryTypes.SELECT });
    return listings.map(listing => ({
      ...listing,
      saleAmount: parseFloat(listing.saleAmount.toFixed(2))
    }));
  }

  async hotListingsByNumberBookingTop5() {
    const query = `
      SELECT saleAmount,bookingNumber FROM listings ORDER BY bookingNumber DESC LIMIT 5
      `;
    const listings = await this.sequelize.query(query, { type: QueryTypes.SELECT });
    return listings.map(listing => ({
      ...listing,
      saleAmount: parseFloat(listing.saleAmount.toFixed(2)),
    }))
  }

  async getListingsForUser(userId) {
    if (!this.context.user) {
      throw new GraphQLError('You must be logged in to view listings', { extensions: { code: 'UNAUTHENTICATED' } });
    }
    try {
      const query = `SELECT * from listing where userId=${userId}`
      return this.sequelize.query(query, { type: QueryTypes.SELECT })
    } catch (error) {
      console.error('Error fetching listings for user:', error);
      throw new GraphQLError('Error fetching listings', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async getAllListings() {
    const listings = await Listing.findAll({
      include: [
        {
          model: Location, // Assuming you have a Location model
          as: 'location', // Use the proper alias if needed
        },
        {
          model: Amenity, // Assuming you have an Amenity model
          as: 'amenities', // Use the proper alias if needed
        }
      ],
    });
    return listings;
  } catch(error) {
    console.error('Error fetching listing:', error);
    throw new GraphQLError('Error fetching listing', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
  }


  async getListingsByUser(userId) {
    try {
      const query = `SELECT * FROM listings WHERE userId=${userId}`
      const response = await this.sequelize.query(query, { type: QueryTypes.SELECT })
      if (response.data.length > 0) {
        return response.data;
      } else {
        throw new GraphQLError('Listing not found', { extensions: { code: 'NOT_FOUND' } });
      }
    } catch (e) {
      console.error('Error fetching listing by ID:', e);
      throw new GraphQLError('Error fetching listing', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }
  async getListingsByHost(userId) {
    try {
      const query = `SELECT * FROM listings WHERE hostId=${userId}`
      const response = await this.sequelize.query(query, { type: QueryTypes.SELECT })
      if (response.data.length > 0) {
        return response.data;
      } else {
        throw new GraphQLError('Listing not found', { extensions: { code: 'NOT_FOUND' } });
      }
    } catch (e) {
      console.error('Error fetching listing by ID:', e);
      throw new GraphQLError('Error fetching listing', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async getListingById(id) {
    try {
      const listing = await this.sequelize.models.Listing.findByPk(id, {
        include: [{
          model: this.sequelize.models.Location,
          as: 'locations'  // Use alias defined in the association
        }]
      });

      if (!listing) {
        throw new Error('Listing not found');
      }

      return listing;
    } catch (error) {
      console.error('Error fetching listing:', error);
      throw new GraphQLError('Error fetching listing', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  }


  async searchListings({ numOfBeds, checkInDate, checkOutDate, page, limit, sortBy }) {
    if (!Number.isInteger(numOfBeds) || numOfBeds <= 0) {
      throw new Error('Number of beds must be a positive integer');
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkIn > checkOut) {
      throw new Error('Check-in date must be before check-out date');
    }

    const checkInISO = checkIn.toISOString().slice(0, 10);
    const checkOutISO = checkOut.toISOString().slice(0, 10);

    try {
      const query = `
        SELECT * FROM listings 
        WHERE numOfBeds = :numOfBeds 
          AND checkInDate = :checkInDate 
          AND checkOutDate = :checkOutDate
        LIMIT :limit OFFSET :offset
      `;

      const response = await this.sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: {
          numOfBeds,
          checkInDate: checkInISO,
          checkOutDate: checkOutISO,
          limit: parseInt(limit, 10),
          offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
        }
      });

      return response;
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw new Error('Error fetching listings');
    }
  }

  async getFeaturedListings() {
    try {
      const listings = await this.sequelize.models.Listing.findAll({
        where: { isFeatured: true },
      });
      return listings;
    } catch (error) {
      console.error('Error fetching featured listings:', error);
      throw new Error('Error fetching featured listings');
    }
  }

  async getListing(id) {  // Updated to match the resolver method name
    try {
      return await Listing.findByPk(id, {
        include: [
          {
            model: Amenity,
            as: 'amenities' // Adjust this to match your association
          },
          {
            model: Location,
            as: 'location'  // Adjust this to match your association
          }
        ]
      });
    } catch (error) {
      console.error('Error fetching listing:', error);
      throw new GraphQLError('Error fetching listing', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async getCoordinates(listingId) {
    try {
      console.log('Fetching coordinates for listingId:', listingId); // Log the listingId being queried

      const query = `
        SELECT c.* FROM coordinates AS c
        JOIN listings AS l ON l.id = c.listingId
        WHERE l.id = :listingId
      `;
      const coordinates = await this.sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: { listingId },
      });

      console.log('Coordinates result:', coordinates); // Log the result of the query

      if (!coordinates || coordinates.length === 0) {
        throw new Error('Coordinates not found');
      }

      return coordinates[0]; // Return the first coordinate object
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      throw new GraphQLError('Error fetching coordinates', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }

  async getCoordinatesByListingId(listingId) {
    try {
      console.log('Fetching coordinates for listingId:', listingId); // Log the listingId being queried

      const query = `
        SELECT c.* FROM coordinates AS c
        JOIN listings AS l ON l.id = c.listingId
        WHERE l.id = :listingId
      `;
      // const coordinates = await this.sequelize.query(query, {
      //   type: QueryTypes.SELECT,
      //   replacements: { listingId },
      // });

      const coordinates = await Listing.findOne({
        where: { id: listingId },
        include: [{ model: Coordinate, as: 'coordinates' }],
      });

      console.log('Coordinate result:', coordinates); // Log the result of the query

      if (!coordinates || coordinates.length === 0) {
        throw new Error('Coordinates not found');
      }

      return coordinates[0]; // Return the first coordinate object
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      throw new GraphQLError('Error fetching coordinates', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }
  async getTotalCost({ listingId, checkInDate, checkOutDate }) {
    // if (!listingId || !checkInDate || !checkOutDate) {
    //   throw new Error('Listing ID, check-in, and check-out dates are required');
    // }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new Error('Invalid dates provided');
    }

    if (checkIn >= checkOut) {
      throw new Error('Check-in date must be before check-out date');
    }

    // Generate a unique cache key using listingId, checkInDate, and checkOutDate
    const cacheKey = `totalCost:${listingId}:${checkInDate}:${checkOutDate}`;

    try {
      // Check cache for existing total cost
      const cachedTotalCost = await cacheClient.get(cacheKey);
      if (cachedTotalCost) {
        console.log(`Cache hit for key: ${cacheKey}`);
        return { totalCost: cachedTotalCost };
      }

      // If no cache, fetch total cost from the database
      const listing = await Listing.findByPk(listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }

      const totalDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)); // Difference in days
      const totalCost = totalDays * listing.pricePerDay;

      // Cache the total cost for 1 hour (3600 seconds)
      await cacheClient.set(cacheKey, totalCost, 3600);

      return { totalCost };
    } catch (error) {
      console.error('Error fetching total cost:', error);
      throw new GraphQLError('Error fetching total cost', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }

  async getAllAmenities() {
    try {
      const query = `SELECT * FROM AMENITIES`;
      const response = await this.sequelize.query(query, { type: QueryTypes.SELECT });
      console.log('Raw database response:', response);
      // Ensure the response contains data
      if (!response || !Array.isArray(response)) {
        throw new Error('Invalid response from the database');
      }

      // Map the amenities and provide default values for non-nullable fields

      // Provide a default value if category is null
      const amenities = response.map(amenity => ({
        id: amenity.id, // Explicitly map the required fields
        name: amenity.name,
        // Ensure category has a valid value or default to 'UNKNOWN'
        category: amenity.category
          ? amenity.category.replace(' ', '_').toUpperCase()
          : 'UNKNOWN',
      }));
      console.log('Processed amenities:', amenities);
      return amenities;
    } catch (error) {
      console.error('Error fetching amenities:', error);
      throw new GraphQLError('Error fetching amenities', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async getListingsByHost(hostId) {
    try {
      const query = `
        SELECT * FROM listings WHERE hostId = :hostId
      `;
      const listings = await this.sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: { hostId },
      });
      return listings;
    } catch (error) {
      console.error('Error fetching listings by host:', error);
      throw new GraphQLError('Error fetching listings by host', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async getAmenitiesForListing(listingId) {
    try {
      const query = `
        SELECT a.* 
        FROM AMENITIES a
        JOIN LISTINGAMENITIES la ON la.amenityId = a.id
        WHERE la.listingId = :listingId
      `;
      const response = await this.sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: { listingId }
      });

      if (!response || !Array.isArray(response)) {
        throw new Error('Invalid response from the database');
      }

      const amenities = response.map(amenity => ({
        id: amenity.id,
        name: amenity.name,
        category: amenity.category ? amenity.category.replace(' ', '_').toUpperCase() : 'UNKNOWN',
      }));

      return amenities;
    } catch (error) {
      console.error('Error fetching amenities for listing:', error);
      throw new GraphQLError('Error fetching amenities for listing', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  }

  async hostListings() {
    try {
      const query = `
        SELECT * FROM listings WHERE hostId = :hostId
      `;
      const listings = await this.sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: { hostId },
      });
      return listings;
    } catch (error) {
      console.error('Error fetching listings by host:', error);
      throw new GraphQLError('Error fetching listings by host', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async deleteListing(id) {
    const pool = await dbConfig.mysql(); // Get the MySQL connection pool

    try {
      const [result] = await pool.query('DELETE FROM listings WHERE id = ?', [id]);

      console.log('Delete results:', result);

      if (result.affectedRows === 0) {
        throw new Error('No listing found with the given id');
      }

      console.log('Deleted listing with ID successfully:', id);

      // Double-check if the listing still exists
      const [checkResult] = await pool.query('SELECT * FROM listings WHERE id = ?', [id]);
      if (checkResult.length > 0) {
        throw new Error(`Failed to delete listing with ID: ${id}`);
      }

      console.log(`Verified deletion of listing with ID: ${id}`);

    } catch (error) {
      console.error('Error deleting listing:', error);
      throw new Error('Error deleting listing');
    } finally {
      pool.end(); // Close the pool to release the connection
    }
  }


  async updateListingStatus(id, listingStatus) {
    try {
      const query = `
        UPDATE listings 
        SET listingStatus = :listingStatus
        WHERE id = :id
      `;

      // Execute the update query
      const [results, metadata] = await this.sequelize.query(query, {
        type: QueryTypes.UPDATE,
        replacements: { id, listingStatus },
      });

      // Log the results for debugging
      console.log('Update query results:', results, metadata);

      // Perform a select query to fetch the updated status
      const [updatedRecord] = await this.sequelize.query(`
        SELECT listingStatus FROM listings WHERE id = :id
      `, {
        type: QueryTypes.SELECT,
        replacements: { id },
      });

      // Check if the listing was found and updated
      if (!updatedRecord) {
        throw new Error('No listing found with the given id');
      }
      return updatedRecord.listingStatus; // Return the updated status
    } catch (error) {
      console.error('Error updating listing status:', error);
      throw new GraphQLError('Error updating listing status', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }



  async getTop5Listings() {
    const pool = await dbConfig.mysql(); // Get the MySQL connection pool

    try {
      const [rows] = await pool.query('SELECT * FROM listings ORDER BY rating DESC LIMIT 5');

      console.log('Top 5 listings:', rows);

      return rows;
    } catch (error) {
      console.error('Error fetching top 5 listings:', error);
    }
  }

  async createListing(listingData, transaction) {
    try {
      const {
        title,
        locationId: resolvedLocationId,
        checkInDate,
        checkOutDate,
        isFeatured,
        hostId,
        description,
        pictures,
        numOfBeds,
        costPerNight,
        locationType,
        listingStatus,
        amenities = []
      } = listingData;

      console.log("Resolved Location ID:", resolvedLocationId);

      // Validate the locationId for UUID format  
      if (!resolvedLocationId || !uuidValidate(resolvedLocationId)) {
        throw new Error('Invalid locationId supplied. Expected a valid UUID.');
      }

      console.log("Listing data before to create:", listingData);

      const newListing = await Listing.create({
        title,
        locationId: resolvedLocationId,
        checkInDate,
        checkOutDate,
        isFeatured,
        hostId,
        description,
        pictures,
        numOfBeds,
        costPerNight,
        locationType,
        listingStatus,
      }, { transaction });

      console.log("New Listing created:", newListing);

      // Handle amenities association if amenities array is provided  
      if (amenities.length > 0) {
        await this.database.ListingAmenities.bulkCreate(
          amenities.map(amenityId => ({
            listingId: newListing.id,  // Ensure newListing exists and is valid  
            amenityId
          })),
          { transaction }
        );
      }

      return newListing;

    } catch (error) {
      console.error('Error creating listing:', error.message || error);
      throw new GraphQLError('Error creating listing', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  }

  async getLocations() {
    try {
      const query = `SELECT * FROM locations`
      const locations = await this.sequelize.query(query, { type: QueryTypes.SELECT });
      return locations;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw new GraphQLError('Error fetching locations', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async numberOfUpcomingBookings(listingId) {
    try {
      const query = `SELECT COUNT(*) as count FROM bookings WHERE listingId = ? AND startDate > CURDATE()`;
      const response = await this.sequelize.query(query, { replacements: [listingId], type: QueryTypes.SELECT });
      return response[0].count;
    } catch (error) {
      console.error('Error fetching number of upcoming bookings:', error);
      throw new GraphQLError('Error fetching number of upcoming bookings', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async getBookingsByListing(listingId) {
    try {
      const query = `
        SELECT * FROM bookings WHERE listingId = ?
      `;
      const bookings = await this.sequelize.query(query, { replacements: [listingId], type: QueryTypes.SELECT });
      return bookings;
    } catch (error) {
      console.error('Error fetching bookings by listing:', error);
      throw new GraphQLError('Error fetching bookings by listing', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async getLocationById(listingId) {
    try {
      const query = `SELECT * FROM locations WHERE listingId = ?`; // Query using listingId
      console.log('Listing ID:', listingId); // Log listingId for debugging

      const response = await this.sequelize.query(query, {
        replacements: [listingId],  // Correct replacement for listingId
        type: QueryTypes.SELECT
      });

      if (response.length === 0) {
        console.log(`Location not found for listing ID: ${listingId}`);
        return null;  // Return null if no location is found
      }

      console.log('Query result:', response);
      return response[0];  // Return the first location found
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw new GraphQLError('Error fetching locations', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async updateListing({ listing, listingId }) {
    try {
      if (!listing || !listingId) {
        throw new Error("Missing required fields: listing or listingId"); // Error updating listing: Error: Missing required fields: listing or listingId
      }
      const { title, description, costPerNight, pictures } = listing; //TypeError: Cannot destructure property 'title' of 'listing' as it is undefined.

      console.log("Updating listing with id:", listingId, "and data:", listing);
      let query = `UPDATE listings SET title = :title`;
      const replacements = { title, listingId };
      if (description !== undefined) {
        query += `, description = :description`;
        replacements.description = description;
      }

      if (costPerNight !== undefined) {
        query += `, costPerNight = :costPerNight`;
        replacements.costPerNight = costPerNight;
      }
      if (pictures !== undefined) {
        query += `, pictures = :pictures`;
        replacements.pictures = JSON.stringify(pictures); // Convert array to JSON string
      }
      query += ` WHERE id = :listingId`;
      await sequelize.query(query, {
        replacements,
      });
      console.log("Executing query:", query);
      console.log("With replacements:", { title, description, costPerNight, listingId });

      const [updateResult] = await this.sequelize.query(query, {
        replacements
      },
      );

      // Fetch the updated listing to include location and other fields
      const updatedListing = await Listing.findByPk(listingId);
      return updatedListing
    } catch (error) {
      console.error('Error updating listing:', error);
      throw new GraphQLError('Error updating listing', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async hotListingsByMoneyBookingTop5() {
    const query = `
      SELECT saleAmount FROM listings ORDER BY saleAmount DESC LIMIT 5
    `;
    const listings = await this.sequelize.query(query, { type: QueryTypes.SELECT });
    return listings.map(listing => ({
      ...listing,
      saleAmount: parseFloat(listing.saleAmount.toFixed(2))
    }));
  }

  async getListings({ numOfBeds, page, limit, sortBy }) {
    console.log('getListings called with:', { numOfBeds, page, limit, sortBy });
    if (numOfBeds === undefined || page === undefined || limit === undefined) {
      throw new Error('Missing required parameters');
    }
    const skipValue = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let sortOrder = 'DESC'; // default descending cost

    if (sortBy === 'COST_ASC') {
      sortOrder = 'ASC';
    }

    try {
      const query = `
      SELECT * 
      FROM listings 
      WHERE numOfBeds = :numOfBeds 
      ORDER BY costPerNight ${sortOrder}
      LIMIT :limit OFFSET :skipValue
    `;

      const response = await this.sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: { numOfBeds, limit: parseInt(limit, 10), skipValue },
      });
      console.log('Listings fetched:', response); // Debugging line
      return response; // directly return the response array

    } catch (error) {
      console.error('Error fetching listings:', error);
      throw new Error('Failed to fetch listings');
    }
  }
  async getCurrentlyBookedDateRangesForListing(listingId) {
    try {
      const query = `
        SELECT * FROM bookings WHERE listingId = :listingId
      `;
      const bookings = await this.sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: { listingId },
      });
      return bookings;
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }

  async getListingsForHost(userId) {
    try {
      const query = `
        SELECT * FROM listings WHERE hostId = :userId
      `;
      const listings = await this.sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: { userId },
      });
      return listings;
    } catch (error) {
      console.error('Error fetching listings for host:', error);
      throw new Error('Failed to fetch listings for host');
    }
  }
}

export default ListingService;
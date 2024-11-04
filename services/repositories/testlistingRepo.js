import ListingRepository from "./listingRepository.js";

const testListingRepo = async () => {
    const listingRepository = new ListingRepository();
    await listingRepository.initPromise; // Ensure the repository is fully initialized
  
    try {
      const listings = await listingRepository.getListingsTop5ByMoneyBooking();
      console.log(listings);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  testListingRepo();
import BaseRepository from './baseRepository.js'

class ProfileRepository extends BaseRepository{
  constructor({ mongodb }) {
    super();
    this.collection = mongodb.collection('profiles');
    }
  
    findOne(query) {
      return this.collection.findOne(query).exec();
    }
  
    find(query = {}) {
      return this.collection.find(query).exec();
    }
  
    findById(id) {
      return this.collection.findById(id).exec();
    }
  
    findOneAndUpdate(query, update, options) {
      return this.collection.findOneAndUpdate(query, update, options).exec();
    }
  
    findOneAndDelete(query) {
      return this.collection.findOneAndDelete(query).exec();
    }
  
    save(profile) {
      const newProfile = new this.collection(profile);
      return newProfile.save();
    }
  }
  
  export default ProfileRepository;
  
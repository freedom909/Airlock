import RESTDataSource from '@apollo/datasource-rest'

class ProfileService {
    constructor({ profileRepository }) {
      this.profileRepository = profileRepository;
      this.baseURL = "http://localhost:4020/";
    }
  
    async getProfile({ username }) {
      return this.profileRepository.findOne({ username })
    }
  
    async getProfiles() {
      return this.profileRepository.find()
    }
  
    async getProfileById(id) {
      return this.profileRepository.findById(id)
    }
  
    async getNetworkProfiles(network) {
      return this.profileRepository.find({ _id: { $in: network } })
    }
  
    async checkViewerHasInNetwork(viewerId, profileId) {
      const profile = await this.profileRepository.findById(profileId)
      return profile.network.includes(viewerId);
    }
  
    async createProfile(input) {
      const profile = new this.profileRepository(input);
      return profile.save();
    }
  
    async updateProfile(accountId, updateData) {
      return this.profileRepository.findOneAndUpdate(
        { accountId },
        { $set: updateData },
        { new: true }
      )
    }
  
    async deleteProfile(accountId) {
      const result = await this.profileRepository.findOneAndDelete({ accountId })
      return !!result;
    }
  
    async addToNetwork(accountId, networkMemberId) {
      return this.profileRepository.findOneAndUpdate(
        { accountId },
        { $addToSet: { network: networkMemberId } },
        { new: true }
      ).exec();
    }
  
    async removeFromNetwork(accountId, networkMemberId) {
      return this.profileRepository.findOneAndUpdate(
        { accountId },
        { $pull: { network: networkMemberId } },
        { new: true }
      ).exec();
    }
  }
  
  export default ProfileService;
  
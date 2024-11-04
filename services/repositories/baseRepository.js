class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async create(date){
        try {
            const document= await this.model(date);
            await document.save();
            return document;
    } catch (err) {
        console.error(`Error creating document: ${err}`);
        throw err;
    }
}

    async findById(id){
        try {
            const document=await this.model.findById(id).exec()
            return document;
        }catch (err) {
            console.error(`Error finding document by id: ${err}`);
            throw err;
        }
    }
    async update(id, data){
        try {
            const document=await this.model.findByIdAndUpdate(id, data, {new: true}).exec()
            return document;
        }catch (err) {
            console.error(`Error updating document by id: ${err}`);
            throw err;
        }
    }

    async findAll(){
        try {
            const documents=await this.model.find().exec()
            return documents;
        }catch (err) {
            console.error(`Error finding all documents: ${err}`);
            throw err;
        }
    }
}
export default BaseRepository;
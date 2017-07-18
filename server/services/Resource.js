const RequestService = require('../services/RequestService');

class Resource {
  constructor(model) {
    this.Model = model;
    this.getOneRecord = this.getOneRecord.bind(this);
    this.getAllRecords = this.getAllRecords.bind(this);
    this.getManyRecords = this.getManyRecords.bind(this);
    this.createModel = this.createModel.bind(this);
  }

  getAllRecords(filter = {}, model, fields = {}) {
    const ModelToUse = model || this.Model;
    return ModelToUse.find(filter, fields);
  }

  getManyRecords(filter = {}, model = this.Model, limit = 10) {
    return model.find(filter).limit(limit);
  }

  createModel(modelsData, Model = this.Model) {
    const newModel = new Model(modelsData);
    return newModel.validate()
      .catch(err => RequestService.failWithError(err.message || err))
      .then(() => newModel.save())
      .catch(err => RequestService.failWithError(err));
  }

  getOneRecord(filter, model = this.Model) {
    return model.findOne(filter);
  }

  // deleteRecord(filter, ModelToUse = this.Model) {
  //   /*
  //    * TODO implement method
  //    * */
  // }
  //
  // updateRecord(filter, ModelToUse = this.Model) {
  //   /*
  //    * TODO implement method
  //    * */
  // }
}
module.exports = Resource;

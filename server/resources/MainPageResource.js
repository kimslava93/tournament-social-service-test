class MainPageResource {
  static getMainPage(req, res) {
    res.render('index', { title: 'Express' });
  }
}
module.exports = MainPageResource;

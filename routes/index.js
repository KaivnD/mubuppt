var express = require('express');
var router = express.Router();
const {get, post} = require("axios").default
const url = require("url")

const docInfoApi = "http://api2.mubu.com/v3/doc/"
const docGetApi = "https://api2.mubu.com/v3/api/document/view/get/"

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/:doc', (req, res) => {  
  const docID = req.params.doc
  if (!docID) res.status(403).send("Error:")

  const info = url.resolve(docInfoApi, docID)
 
  get(info).then(results => {
      const id = results.data.data.doc.id
      post(docGetApi, {docId: id}).then(data => {
          if (data.data.code !== 0) return
          const {name, definition} = data.data.data
          const doc = JSON.parse(definition)
          console.log(doc.nodes)

          const slides = []

          doc.nodes.forEach(node => {
            if (node.heading === 1) {
              slides.push({
                title: node.text
              })
            }
          });

          res.render('ppt', {slides})
      }).catch(() => res.status(403).send("Error:"))
  }).catch(() => res.status(403).send("Error:"))  
})

module.exports = router;

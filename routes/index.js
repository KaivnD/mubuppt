var express = require('express');
var router = express.Router();
const { post } = require("axios").default

const docGetApi = "https://api2.mubu.com/v3/api/document/view/get/"

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

const parseStringArgs = str => {
  const rg = /\{(.+?)\}/g
  const res = {}

  if (!str) return res

  const match = str.match(rg)
  if (!match) return res
  const tmp = match.map(x=>x.split(rg)[1])
  if (!tmp.length) return res
  const config = tmp[0].split(",")
  for(let conf of config) {
    let t = conf.split("=")
    if (t.length !== 2)continue
    res[t[0]] = t[1].replace(/<[^>]*>|<\/[^>]*>/gm, "")
  }
  return res
}

router.get('/:doc', async (req, res) => {
  let docId = req.params.doc
  if (!docId) res.status(403).send("Error:1")

  if (docId.startsWith("doc")) docId = docId.replace("doc", "")

  try {
    const {data} = await post(docGetApi, { docId })

    if (data.code !== 0) throw new Error(`Could not find a mubu document with ID: ${docId}`)
    const { name, definition } = data.data
    const doc = JSON.parse(definition)

    if (!(doc.nodes instanceof Array)) throw new Error(`document has no nodes array`)
    
    const slides = []

    slides.push({
      title: name,
      template: 'title-center'
    })

    for (let node of doc.nodes) {
      if (node.heading !== 1) continue

      slides.push({
        title: node.text,
        subtitle: !node.note ? "" : node.note.replace(/\{(.+?)\}/g, ""),
        template: 'title-center',
        ...parseStringArgs(node.note)
      })

      if (!node.hasOwnProperty('children') || !(node.children instanceof Array)) continue

      for (let child of node.children) {
        if (child.heading !== 2) continue

        let items = []
        if (child.hasOwnProperty('children') && child.children instanceof Array) {
          for (let i of child.children) {
            items.push({
              header: i.text
            })
          }
        }

        slides.push({
          title: child.text,
          subtitle: !child.note ? "" : child.note.replace(/\{(.+?)\}/g, ""),
          template: 'title-center',           
          items,
          ...parseStringArgs(child.note)
        })
      }
    }

    res.render('ppt', { title: name, slides })

  } catch (err) {
    res.render('error', {message: err.message, status: err.status, stack: err.stack})
  }
})

module.exports = router;

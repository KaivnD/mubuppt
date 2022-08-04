var express = require("express");
var router = express.Router();
const { post } = require("axios").default;

const docGetApi = "https://api2.mubu.com/v3/api/document/view/get/";
const shareGetApi = "https://api2.mubu.com/v3/api/document/share/get";

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

const removeAllHtmlTags = (str) => str.replace(/<[^>]*>|<\/[^>]*>/gm, "");

const parseStringArgs = (str) => {
  const rg = /\{(.+?)\}/g;
  const res = {};

  if (!str) return res;

  const match = str.match(rg);
  if (!match) return res;
  const tmp = match.map((x) => x.split(rg)[1]);
  if (!tmp.length) return res;
  const config = tmp[0].split(",");
  for (let conf of config) {
    let t = conf.split("=");
    if (t.length !== 2) continue;
    const key = removeAllHtmlTags(t[0]);
    const value = removeAllHtmlTags(t[1]);
    res[key] = value;
  }
  return res;
};

router.get("/doc/:id", async (req, res) => {
  try {
    let id = req.params.id;
    const { data } = await post(shareGetApi, { shareId: id });

    if (data.code !== 0)
      throw new Error(`Could not find a mubu document with ID: ${id}`);
    const doc = data.data.doc;
    if (!doc || !doc.id) throw new Error("origin doc id failed to find");

    res.redirect(`/${doc.id}`);
  } catch (ex) {
    res.render("error", {
      message: ex.message,
      status: ex.status,
      stack: ex.stack,
    });
  }
});

router.get("/:doc", async (req, res) => {
  let docId = req.params.doc;
  if (!docId) res.status(403).send("Error:1");

  try {
    const { data } = await post(docGetApi, { docId });

    if (data.code !== 0)
      throw new Error(`Could not find a mubu document with ID: ${docId}`);
    const { name, definition } = data.data;
    const doc = JSON.parse(definition);

    if (!(doc.nodes instanceof Array))
      throw new Error(`document has no nodes array`);

    const slides = [];

    slides.push({
      title: name,
      template: "title-center",
    });

    for (let node of doc.nodes) {
      if (node.heading !== 1) continue;

      slides.push({
        title: node.text,
        subtitle: !node.note ? "" : node.note.replace(/\{(.+?)\}/g, ""),
        template: "title-center",
        ...parseStringArgs(node.note),
      });

      if (!node.hasOwnProperty("children") || !(node.children instanceof Array))
        continue;

      for (let child of node.children) {
        if (child.heading !== 2) continue;

        const args = parseStringArgs(child.note);

        let slide = {
          title: child.text,
          subtitle: !child.note ? "" : child.note.replace(/\{(.+?)\}/g, ""),
          template: "title-center",
          items: [],
          ...args,
        };

        if (
          !child.hasOwnProperty("children") ||
          !(child.children instanceof Array)
        ) {
          slides.push(slide);
          continue;
        }

        let imgSlideFlag = 0;

        if (
          child.hasOwnProperty("images") &&
          child.images instanceof Array &&
          child.images.length > 0
        ) {
          slide.bgUrl = child.images[0].uri;
          slide.template = "img-side-full";
        }

        for (let page of child.children) {
          const item = {
            header: page.text,
            content: page.note,
          };

          if (
            page.hasOwnProperty("images") &&
            page.images instanceof Array &&
            page.images.length > 0
          ) {
            ++imgSlideFlag;
            item.img = page.images[0].uri;
          }

          slide.items.push(item);
        }

        if (imgSlideFlag === child.children.length)
          slide.template = "img-content";

        slides.push(slide);
      }
    }

    res.render("ppt", { title: name, slides });
  } catch (err) {
    res.render("error", {
      message: err.message,
      status: err.status,
      stack: err.stack,
    });
  }
});

module.exports = router;

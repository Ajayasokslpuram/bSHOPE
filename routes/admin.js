var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('admin/admin-dashboard')
});
module.exports = router;

router.get('/viewproducts', function(req, res, next) {
  res.render('admin/view-products')
});
module.exports = router;
router.get('/addproducts', function(req, res, next) {
  res.render('admin/add-products')
});

router.post('/addproducts', function(req, res, next) {
  // console.log(req.body)
  // console.log( (req.files.image) );
  productHelpers.addProduct(req.body,(id)=>{
      console.log(id)
      let image=req.files.image
        image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
          if(!err){
            res.render('admin/add-products')
          }
          else console.log(err)
        })
  })
  // res.render('admin/add-products')
});
module.exports = router;
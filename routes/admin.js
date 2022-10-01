var express = require('express');
const { response } = require('../app');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')

/* GET users listing. */

router.get('/', function(req, res, next) {
  res.render('admin/admin-dashboard',{admin:true})
});
module.exports = router;

router.get('/login', function(req, res, next) {
  res.render('admin/admin-login',{admin:true,'loginErr':req.session.loginErr})
  req.session.loginErr=null
});
module.exports = router;

router.post('/adminsignin', function(req, res, next) {
  console.log(req.body.email)
  const adminID="admin";
  const adminPass="admin";
  if(req.body.email==adminID&&req.body.password==adminPass){
    res.redirect('/admin')
  }
  else{
    req.session.loginErr=true;
    res.redirect('/admin/login')
  }

});
module.exports = router;

router.get('/viewproducts', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    console.log(products)
    res.render('admin/view-products',{admin:true,products})
  })
});
module.exports = router;
router.get('/addproducts', function(req, res, next) {
  res.render('admin/add-products',{admin:true})
});

router.post('/addproducts', function(req, res, next) {
  // console.log(req.body)
  // console.log( (req.files.image) );
  productHelpers.addProduct(req.body,(id)=>{
      console.log(id)
      let image=req.files.image
      let image1=req.files.image1
      let image2=req.files.image2
      image.mv('./public/product-images/'+id+'.jpg')
      image1.mv('./public/product-images/'+id+'1.jpg')
      image2.mv('./public/product-images/'+id+'2.jpg',(err,done)=>{
          if(!err){
            res.render('admin/add-products',{admin:true})
          }
          else console.log(err)
        })
  })
  // res.render('admin/add-products')
});

router.get('/delete-product/:id', function(req, res, next) {

    let productId=req.params.id
    productHelpers.deleteProduct(productId).then((response)=>{
      res.redirect('/admin/viewproducts')
    })
 
});

router.get('/edit-product/:id', function(req, res, next) {
 
    productHelpers.getProductDetails(req.params.id).then((product)=>{
      console.log(product)
      res.render('admin/edit-product',{admin:true,product})
    })
});

router.post('/update-product/:id', function(req, res, next) {
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    if(req.files){
      let image=req.files.image
      let image1=req.files.image1
      let image2=req.files.image2
      image.mv('./public/product-images/'+req.params.id+'.jpg')
      image1.mv('./public/product-images/'+req.params.id+'1.jpg')
      image2.mv('./public/product-images/'+req.params.id+'2.jpg',(err,done)=>{
          if(!err){
            res.redirect('/admin/viewproducts')
          }
          else console.log(err)
        })
    }
  })
});

// ============================ U S E R S ===========================

router.get('/viewusers', function(req, res, next) {
  productHelpers.getAllUsers().then((users)=>{
    console.log(users)
    res.render('admin/view-users',{admin:true,users})
  })
});

router.get('/blockuser/:id', function(req, res, next) {
  productHelpers.blockUser(req.params.id).then((blockeduser)=>{
    console.log('Blockd uer Id'+blockeduser.name)
     res.redirect('/admin/viewusers')
  });

})

router.get('/unblockuser/:id', function(req, res, next) {
  productHelpers.unblockUser(req.params.id).then((blockeduser)=>{
     res.redirect('/admin/viewusers')
  });

})


module.exports = router;
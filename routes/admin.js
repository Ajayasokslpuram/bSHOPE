const { request } = require('express');
var express = require('express');
const { response } = require('../app');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')

/* GET users listing. */

router.get('/', function(req, res, next) {
  res.render('admin/sample-dash',{title:'Admin Page',layout:'adminLayout'})
});


router.get('/login', function(req, res, next) {
  res.render('admin/admin-login',{admin:true,'loginErr':req.session.loginErr})
  req.session.loginErr=null
});


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

router.get('/viewproducts', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products})
  })
});

router.get('/addproducts', function(req, res, next) {
  productHelpers.getAllCategories().then((categories)=>{
    res.render('admin/add-products',{admin:true,categories})
  })
 
});

router.post('/addproducts', function(req, res, next) {
  req.body.price=parseInt(req.body.price)
  // console.log(req.body)
  // console.log( (req.files.image) );
  console.log(req.body)
  
  productHelpers.addProduct(req.body,(id)=>{
      console.log(id)
      let image=req.files.image
      let image1=req.files.image1
      let image2=req.files.image2
      image.mv('./public/product-images/'+id+'.jpg')
      image1.mv('./public/product-images/'+id+'1.jpg')
      image2.mv('./public/product-images/'+id+'2.jpg',(err,done)=>{
          if(!err){
            res.redirect('/admin/addproducts')
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
      productHelpers.getAllCategories().then((categories)=>{
        res.render('admin/edit-product',{admin:true,product,categories})
      })
      
    })
});

router.post('/update-product/:id', function(req, res, next) {
  req.body.price=parseInt(req.body.price)
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
    res.render('admin/view-users2',{layout:'adminLayout',admin:true,users})
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



/*--------------------- CATEGORIES ----------------------------*/


router.get('/categories', function(req, res, next) {
  productHelpers.getAllCategories().then((categories)=>{
    res.render('admin/categories',{admin:true,categories,errMessage:req.flash('deleteStatusFalse'),succMessage:req.flash('deleteStatusTrue')})
  }) 

})

router.post('/add-category', function(req, res, next) {
 
  productHelpers.addCategory(req.body,(id)=>{
      console.log(id)
            res.redirect('/admin/categories')
});
})


router.get('/delete-category/:id', function(req, res, next) {

  let categoryId=req.params.id
  productHelpers.deleteCategory(categoryId).then((response)=>{
    console.log(response)
    if(response.DeleteStatus){
      req.flash('deleteStatusTrue',`Sussessfully Deleted ${response.category} !`)
      res.redirect('/admin/categories')
    }
    else{
      req.flash('deleteStatusFalse',`Cannot Delete ${response.category} since it has ${response.products.length} products!`)
      res.redirect('/admin/categories')

    }
  })
});

router.get('/edit-category/:id', function(req, res, next) {
 
  productHelpers.getCategoryDetails(req.params.id).then((category)=>{

      res.render('admin/edit-category',{admin:true,category})
    
  })
});

router.post('/update-category/:id', function(req, res, next) {
  productHelpers.updateCategory(req.params.id,req.body).then(()=>{
  
            res.redirect('/admin/categories')
  })
});


// ========================== BANNERS =========================

router.get('/banners', function(req, res, next) {
  productHelpers.getAllCategories().then((categories)=>{
    res.render('admin/banners',{admin:true,categories})
  
  })
});



router.post('/addbanner', function(req, res, next) {
  // console.log(req.body)
  // console.log( (req.files.image) );
  console.log(req.body)
  
  productHelpers.addBanner(req.body,(id)=>{
      console.log(id)
      let image=req.files.image
      let image1=req.files.image1
      let image2=req.files.image2
      image.mv('./public/banner-images/'+id+'.jpg')
      image1.mv('./public/banner-images/'+id+'1.jpg')
      image2.mv('./public/banner-images/'+id+'2.jpg',(err,done)=>{
          if(!err){
            res.redirect('/admin/banners')
          }
          else console.log(err)
        })
  })
  // res.render('admin/add-products')
});


router.get("/order-table", async (req, res, next) => {
  let orders = await productHelpers.getAllOrders().then((orders)=>{
    res.render('admin/order-table', {layout:'adminLayout',orders})
  })

  
})

router.post("/change-order-status", async (req, res, next) => {
  console.log('api called')
  productHelpers.changeOrderStatus(req.body.newStatus,req.body.orderID).then(()=>{
    res.json({changeStatus:true})
  })
 console.log(req.body.newStatus,req.body.orderID)
  
})

module.exports = router;
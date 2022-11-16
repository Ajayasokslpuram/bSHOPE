const { request } = require('express');
var express = require('express');
const { Db } = require('mongodb');
const { response } = require('../app');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var fs = require('fs');
var Handlebars = require('handlebars');

const verifySession = (req, res, next) => {
  if (req.session.admin) {
    next()
  }
  else {
    res.redirect('/admin/login')
  }
}

/* GET users listing. */

router.get('/', verifySession, function (req, res, next) {

  productHelpers.getInsights().then((resolveObject) => {
    console.log(resolveObject.monthSales[0].products, 'monthsales')
    res.render('admin/sample-dash',
      {
        title: 'Admin Page', layout: 'adminLayout',
        barData: resolveObject.barData,
        total: resolveObject.total,
        codTotal: resolveObject.codTotal,
        payPalTotal: resolveObject.payPalTotal,
        razorPayTotal: resolveObject.razorPayTotal,
        monthSales: resolveObject.monthSales,
        month: resolveObject.month,
        walletTotal: resolveObject.walletTotal,
      })
  })


});


router.get('/login', function (req, res, next) {
  res.render('admin/admin-login', { admin: true, 'loginErr': req.session.loginErr })
  req.session.loginErr = null
});


router.post('/adminsignin', function (req, res, next) {
  console.log(req.body.email)
  const adminID = "admin";
  const adminPass = "admin";
  if (req.body.email == adminID && req.body.password == adminPass) {
    req.session.admin = true;
    res.redirect('/admin')
  }
  else {
    req.session.loginErr = true;
    res.redirect('/admin/login')
  }

});

router.get('/viewproducts', verifySession,async function (req, res, next) {
  const perPage = 10;
  let pageNum;
  let skip;
  let productCount;
  let pages;
  pageNum = parseInt(req.query.page)>=1?parseInt(req.query.page):1;
  skip = (pageNum - 1) * perPage
  await productHelpers.getProductCount().then((count) => {
    productCount = count;
  })
  pages = Math.ceil(productCount / perPage)

  Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  Handlebars.registerHelper('for', function (from, to, incr, block) {
    var accum = '';
    for (var i = from; i <= to; i += incr)
      accum += block.fn(i);
    return accum;
  });
  let index=parseInt(skip)>=1?skip+1:1
  Handlebars.registerHelper("inc", function(value, options)
  { 
      return parseInt(value) + index;
  });

  productHelpers.getPaginatedProducts(skip, perPage).then((products) => {
    res.render('admin/view-products', { layout: 'adminLayout', admin: true, products,totalDoc: productCount, currentPage: pageNum, pages: pages })
  })
});

router.get('/addproducts', verifySession, function (req, res, next) {
  productHelpers.getAllCategories().then((categories) => {
    res.render('admin/add-products', { admin: true, categories, layout: 'adminLayout' })
  })

});

router.post('/addproducts', verifySession, function (req, res, next) {
  console.log(req.body,'price')
  let productData = {}
  productData.MRP = 0
  productData = req.body;
  productData.price = parseInt(req.body.price)
  productData.MRP = parseInt(req.body.price)
  // console.log(req.body)
  // console.log( (req.files.image) );
  console.log(req.body)

  productHelpers.addProduct(productData, (id) => {
    console.log(id)
    let image = req.files.image
    let image1 = req.files.image1
    let image2 = req.files.image2
    image.mv('./public/product-images/' + id + '.jpg')
    image1.mv('./public/product-images/' + id + '1.jpg')
    image2.mv('./public/product-images/' + id + '2.jpg', (err, done) => {
      if (!err) {
        res.redirect('/admin/addproducts')
      }
      else console.log(err)
    })
  })
  // res.render('admin/add-products')
});

router.get('/delete-product/:id', verifySession, function (req, res, next) {

  let productId = req.params.id
  productHelpers.deleteProduct(productId).then((response) => {
    res.redirect('/admin/viewproducts')
  })

});

router.get('/edit-product/:id', verifySession, function (req, res, next) {

  productHelpers.getProductDetails(req.params.id).then((product) => {
    productHelpers.getAllCategories().then((categories) => {
      res.render('admin/edit-product', { admin: true, product, categories, layout: 'adminLayout' })
    })

  })
});

router.post('/update-product/:id', verifySession, async function (req, res, next) {
  req.body.price = parseInt(req.body.price)
  await productHelpers.updateProduct(req.params.id, req.body).then(() => {
    console.log('reached here');
    if (req.files) {
      let image = req.files.image
      let image1 = req.files.image1
      let image2 = req.files.image2
      image.mv('./public/product-images/' + req.params.id + '.jpg')
      image1.mv('./public/product-images/' + req.params.id + '1.jpg')
      image2.mv('./public/product-images/' + req.params.id + '2.jpg', (err, done) => {
        if (!err) {
          // res.redirect('/admin/viewproducts')
          console.log('no error');
        }
        else console.log(err)
      })
    }
    res.redirect('/admin/viewproducts')
  })
});

// ============================ U S E R S ===========================

router.get('/viewusers', verifySession, function (req, res, next) {
  productHelpers.getAllUsers().then((users) => {
    console.log(users)
    res.render('admin/view-users2', { layout: 'adminLayout', admin: true, users })
  })
});

router.get('/blockuser/:id', verifySession, function (req, res, next) {
  productHelpers.blockUser(req.params.id).then((blockeduser) => {
    console.log('Blockd uer Id' + blockeduser.name)
    res.redirect('/admin/viewusers')
  });

})

router.get('/unblockuser/:id', verifySession, function (req, res, next) {
  productHelpers.unblockUser(req.params.id).then((blockeduser) => {
    res.redirect('/admin/viewusers')
  });

})



/*--------------------- CATEGORIES ----------------------------*/


router.get('/categories', verifySession, function (req, res, next) {
  productHelpers.getAllCategories().then((categories) => {
    res.render('admin/categories', {
      admin: true,
      categories,
      errMessage: req.flash('deleteStatusFalse'),
      succMessage: req.flash('deleteStatusTrue'),
      catAddedTrue:req.flash('addStatusTrue'),
      catAddedFalse:req.flash('addStatusFalse'),
      layout: 'adminLayout',
    
    })
  })

})

router.post('/add-category', verifySession, function (req, res, next) {
   const {name} =req.body;
  productHelpers.addCategory(req.body).then(() => {
    req.flash('addStatusTrue', `Successfully created ${name} Category!`)
    res.redirect('/admin/categories')
  }).catch((response) => {
    req.flash('addStatusFalse', `The Category ${response.name} Already Exists!`)
    res.redirect('/admin/categories')
  })
})


router.get('/delete-category/:id', verifySession, function (req, res, next) {

  let categoryId = req.params.id
  productHelpers.deleteCategory(categoryId).then((response) => {
    console.log(response)
    if (response.DeleteStatus) {
      req.flash('deleteStatusTrue', `Sussessfully Deleted ${response.category} !`)
      res.redirect('/admin/categories')
    }
    else {
      req.flash('deleteStatusFalse', `Cannot Delete ${response.category} since it has ${response.products.length} products!`)
      res.redirect('/admin/categories')

    }
  })
});

router.get('/edit-category/:id', verifySession, function (req, res, next) {

  productHelpers.getCategoryDetails(req.params.id).then((category) => {

    res.render('admin/edit-category', { admin: true, layout: 'adminLayout', category })

  })
});

router.post('/update-category/:id', verifySession, function (req, res, next) {
  productHelpers.updateCategory(req.params.id, req.body).then(() => {

    res.redirect('/admin/categories')
  })
});


// ========================== BANNERS =========================

router.get('/banners', verifySession, async function (req, res, next) {
  let banners = []
  await productHelpers.getAllBanners().then((bannersList) => {
    banners = bannersList;
  })
  await productHelpers.getAllCategories().then((categories) => {
    res.render('admin/banners', { admin: true, categories, layout: 'adminLayout', banners })

  })
});



router.post('/addbanner', verifySession, async function (req, res, next) {
  // console.log(req.body)
  // console.log( (req.files.image) );
  console.log(req.body, req.files, 'bannerpost')

  await productHelpers.addBanner(req.body).then((data) => {
    if (req.files) {
      let image = req.files.image
      image.mv('./public/banner-images/' + data.insertedId + '.jpg', (err, done) => {
        if (!err) {
          res.redirect('/admin/banners')
        }
        else console.log(err)
      })
    }
  })
});


router.get("/set-bannner/:id", verifySession, async (req, res, next) => {
  let id = req.params.id;
  await productHelpers.setBanner(req.params.id).then(async () => {
    res.redirect('/admin/banners')
  })

})

router.get("/order-table", verifySession, async (req, res, next) => {
  const perPage = 5;
  let pageNum;
  let skip;
  let productCount;
  let pages;
  pageNum = parseInt(req.query.page)>=1?parseInt(req.query.page):1;
  skip = (pageNum - 1) * perPage
  await productHelpers.getOrderCount().then((count) => {
    productCount = count;
  })
  pages = Math.ceil(productCount / perPage)
let index=parseInt(skip)>=1?skip+1:1
Handlebars.registerHelper("inc", function(value, options)
{ 
    return parseInt(value) + index;
});

  Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  Handlebars.registerHelper('for', function (from, to, incr, block) {
    var accum = '';
    for (var i = from; i <= to; i += incr)
      accum += block.fn(i);
    return accum;
  });
  let orders = await productHelpers.getPaginatedOrders(perPage,skip).then((orders) => {
    res.render('admin/order-table', { layout: 'adminLayout', orders,totalDoc: productCount, currentPage: pageNum, pages: pages })
  })


})

router.post("/change-order-status", verifySession, async (req, res, next) => {
  console.log('api called')
  productHelpers.changeOrderStatus(req.body.newStatus, req.body.orderID).then(() => {
    res.json({ changeStatus: true })
  })
  console.log(req.body.newStatus, req.body.orderID)
})

// coupons
router.get("/coupons", verifySession, async (req, res, next) => {
  let coupons;
  await productHelpers.getAllCoupons(0).then(async (couponData) => {
    coupons = couponData;
    console.log(coupons, 'coupon')
  })
  if (coupons) {

    res.render('admin/coupons', { layout: 'adminLayout', coupons })
  }
  else {

    res.render('admin/coupons', { layout: 'adminLayout' })
  }

})
router.post("/add-coupon", verifySession, async (req, res, next) => {
  productHelpers.createCoupons(req.body).then((data) => {
    res.redirect('/admin/coupons')
  })
})

router.get("/offers", verifySession, async (req, res, next) => {
  const perPage = 10;
  let pageNum;
  let skip;
  let productCount;
  let pages;
  pageNum = parseInt(req.query.page)>=1?parseInt(req.query.page):1;
  skip = (pageNum - 1) * perPage
  await productHelpers.getProductCount().then((count) => {
    productCount = count;
  })
  pages = Math.ceil(productCount / perPage)
  let index=parseInt(skip)>=1?skip+1:1
  Handlebars.registerHelper("inc", function(value, options)
  { 
      return parseInt(value) + index;
  });
  Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  Handlebars.registerHelper('for', function (from, to, incr, block) {
    var accum = '';
    for (var i = from; i <= to; i += incr)
      accum += block.fn(i);
    return accum;
  });


  let categoryList = []
  let categoryOffers = []
  let productOffers = []
  let products = []
  await productHelpers.getProductOffers().then((offerList) => {
    productOffers = offerList
  })
  await productHelpers.getPaginatedProducts(skip, perPage).then((productList) => {
    products = productList;
  })
  await productHelpers.getCategoryOffers().then((offers) => {
    categoryOffers = offers;
  })
  await productHelpers.getAllCategories().then((categories) => {
    categoryList = categories;
  })
  res.render('admin/offers', { layout: 'adminLayout', categoryList, categoryOffers, products, productOffers,totalDoc: productCount, currentPage: pageNum, pages: pages })
})

router.post("/add-categoryOffer", verifySession, async (req, res, next) => {

  req.body.discount = parseInt(req.body.discount);
  console.log(req.body)
  await productHelpers.createCategoryOffer(req.body).then(async (data) => {
    await productHelpers.applyCategoryOffer(data.insertedId)
    res.redirect('/admin/offers')
  })
})

router.get('/delete-offer/:id', verifySession, async function (req, res, next) {

  let offerID = req.params.id
  await productHelpers.removeCategoryOffer(offerID).then(() => {
    res.redirect('/admin/offers')
  })


})

router.post("/add-productOffer", verifySession, async (req, res, next) => {

  req.body.discount = parseInt(req.body.discount);
  console.log(req.body)
  await productHelpers.createProductOffer(req.body).then(async () => {
    res.redirect('/admin/offers')
  })
})

router.post("/apply-product-offer", verifySession, async (req, res, next) => {

  productHelpers.applyProductOffer(req.body.OfferID, req.body.ProductID).then(() => {
    console.log(req.body, 'product offer reached')
    res.redirect('/admin/offers')
  })
})

router.get('/delete-Product-offer/:id', verifySession, async function (req, res, next) {

  let ProductID = req.params.id
  await productHelpers.removeProductOffer(ProductID).then(() => {
    res.redirect('/admin/offers')
  })
})

router.get('/signout', function (req, res, next) {

  req.session.admin = null;
  res.redirect('/admin/login')
})


module.exports = router;
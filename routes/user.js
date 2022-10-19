var express = require('express');
const { render, response } = require('../app');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers')

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_ID;
const client = require('twilio')(accountSid, authToken);

const verifySession = (req, res, next) => {
  if (req.session.user) {
    next()
  }
  else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', function (req, res, next) {

  productHelpers.getAllCategories().then((categories) => {

    productHelpers.getAllProducts().then((products) => {
      if (req.session.user) {
        let user = req.session.user
        console.log(user.name + 'user from session')
        res.render('user/view-products', { products, user, categories })
      }
      else {
        res.render('user/view-products', { products, categories })
      }
    })
  })

});




router.get('/shop-by-category/:name', function (req, res, next) {

  productHelpers.getProductByCategory(req.params.name).then((products) => {
    console.log(products)
    categoryName = products[0].category
    res.render('user/view-product-by-category', { products, categoryName })
  })
});

// =============================product details page======================

router.get('/productdetails/:id', function (req, res, next) {
  productHelpers.getProductDetails(req.params.id).then((product) => {
    console.log(product)
    res.render('user/product-details', { product })
  })
});

// ============================================================================

router.get('/login', function (req, res, next) {
  if (req.session.user) {
    res.redirect('/')
  }
  else {
    res.render('user/login', { "loginErr": req.session.loginErr })
    req.session.loginErr = null;
  }

})

router.post('/signin', function (req, res, next) {
  userHelpers.doLogin(req.body).then((response) => {
    console.log(response.passStatus)
    console.log(response.emailStatus)
    console.log(response.blockStatus)
    if (response.blockStatus && response.passStatus && response.emailStatus) {
      req.session.user = response.user;
      res.redirect('/')
    }
    else {
      req.session.loginErr = response;
      res.redirect('/login')

    }
  })

})


router.get('/registration', function (req, res, next) {
  res.render('user/registration', { errMessage: req.flash('userExists') })
})

router.post('/signup', function (req, res, next) {
  userHelpers.doSignup(req.body).then((response) => {
    res.redirect('/')
  }).catch(() => {
    req.flash('userExists', 'Email or Mobile is Already Registered !')
    res.redirect('/registration')
  })

})


router.get('/logout', function (req, res, next) {
  req.session.user = null;
  res.redirect('/')
})

// ===================== ADD TO CART ================================

router.get('/add-to-cart/:id', verifySession, function (req, res, next) {
  console.log('api called')

  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    console.log(req.params.id)
    console.log(req.session.user)
    res.redirect('/cart')

  })
})

router.get('/cart', verifySession, async function (req, res, next) {

  let products = await userHelpers.getCartProducts(req.session.user._id)
  let productsNetAmount = 0
  if (products.length > 0) {
    productsNetAmount = await userHelpers.getTotalAmount(req.session.user._id)
  }

  res.render('user/cart', { products, productsNetAmount, user: req.session.user })
})


// ==================== ADD TO WISHLIST ========================


router.get('/add-to-wishlist/:id', verifySession, function (req, res, next) {
  console.log('api called')
  userHelpers.addToWishlist(req.params.id, req.session.user._id).then(() => {
    res.redirect('/')
  })
})

router.get('/wishlist', verifySession, async function (req, res, next) {

  let products = await userHelpers.getWishlistProducts(req.session.user._id)
  console.log(products)
  res.render('user/wishlist', { products, user: req.session.user })
})

router.post('/delete-from-wishlist', verifySession, (req, res, next) => {
  console.log('api called');

  userHelpers.deleteFromWishlist(req.body).then(() => {
    res.json({ status: true })
  })
})

// ===================login otp=====================

// router.get('/login-otp', async function(req, res, next) {

//   res.render('user/otp-login')
// })


router.get('/login-otp', async function (req, res, next) {

  res.render('user/otp-login', { otpSend: req.session.otpSended, numberError: req.session.numberExist, otpErr: req.session.otpError })
  req.session.otpError = null
  req.session.numberExist = null


})

router.post('/send-otp', (req, res) => {

  userHelpers.checkMobileNumber(req.body.phone).then((response) => {
    console.log(req.body.phone)
    if (response) {
      let mobileNumber = (`+91${req.body.phone}`);
      req.session.Phoneno = mobileNumber;
      req.session.mobile = req.body.phone;
      client.verify.v2.services(serviceId)
        .verifications
        .create({ to: mobileNumber, channel: 'sms' })
        .then((verification) => {
          console.log(verification.status);
          req.session.otpSended = true
          res.redirect('/login-otp')
        })

    }
    else {
      req.session.numberExist = "Could not find any user with this Number!"
      console.log('numberExist')
      res.redirect('/login-otp')
    }



    //  
    // }
  })
})


router.get('/resend-otp', (req, res) => {
  let mobileNumber = req.session.Phoneno
  client.verify.v2.services(serviceId)
    .verifications
    .create({ to: mobileNumber, channel: 'sms' })
    .then((verification) => {
      console.log(verification.status);
      req.session.otpSended = true
      res.redirect('/login-otp')
    })
})




router.post('/confirm-otp', (req, res) => {
  userHelpers.checkMobileNumber(req.session.mobile).then((response) => {
    let mobileNumber = req.session.Phoneno
    let otp = req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4 + req.body.digit5 + req.body.digit6;
    console.log(otp)
    client.verify.v2.services(serviceId)
      .verificationChecks
      .create({ to: mobileNumber, code: otp })
      .then((verification_check) => {
        console.log(verification_check.status)
        if (verification_check.status == 'approved') {
          console.log('otp approved')
          req.session.user = response
          res.redirect('/')
        } else {
          console.log('otp rejected')
          req.session.otpSended = true
          req.session.otpError = "Invalid OTP!"
          res.redirect('/login-otp')
        }
      })

  })

})

router.post('/change-product-quantity', verifySession, (req, res, next) => {

  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    // response.productsNetAmount=await userHelpers.getTotalAmount(req.session.user)
    response.productsNetAmount = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.post('/delete-from-cart', verifySession, (req, res, next) => {
  console.log('api called');

  userHelpers.deleteFromCart(req.body).then(() => {
    res.json({ status: true })
  })
})

router.get("/proceed-to-checkout", verifySession, async (req, res, next) => {
  userHelpers.getAllAddress(req.session.user).then(async (address) => {
    let productsNetAmount = await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/checkout', { address, productsNetAmount, user: req.session.user })
  })

})

router.post('/place-order', verifySession, async (req, res, next) => {
  console.log('api called')
  let products = await userHelpers.getCartProductList(req.body.userID)
  let productsNetAmount = await userHelpers.getTotalAmount(req.body.userID)
  let address = {}
  if (req.body.flexRadioDefault == 'new') {
    address = req.body
  } else {
    await userHelpers.getAddress(req.session.user, req.body.flexRadioDefault).then((data) => {
      address = data
      console.log(address, 'after fianalize')
    })
  }
  await userHelpers.placeOrder(req.body, address, products, productsNetAmount).then(async (orderID) => {
    console.log(address, 'parameters ready')
    if (req.body.selector == 'COD') {
      console.log('cod called')
      res.json({ COD_Success: true })
    }
    else {
      await userHelpers.generateRazorpay(orderID, productsNetAmount).then((response) => {
        res.json(response)
      })
    }

  })
})



router.get("/order-success", verifySession, async (req, res, next) => {
  res.render('user/order-confirmation', { user: req.session.user })
})


router.get("/orders", verifySession, async (req, res, next) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders', { user: req.session.user, orders })
})

router.get("/view-order-products/:id", verifySession, async (req, res, next) => {
  let orderProducts = await userHelpers.getOrderProducts(req.params.id)
  await userHelpers.getOrderStatus(req.params.id).then((order) => {
    console.log(order.status, orderProducts, 'order-orderProducts')
    let orderStatus = order.status
    if (orderStatus == 'Placed') {
      console.log(orderStatus, 'orderstatus')
      console.log('placed called')
      res.render('user/view-order-products', { user: req.session.user, orderProducts, Placed: true })
    }
    if (orderStatus == 'Shipped') {
      res.render('user/view-order-products', { user: req.session.user, orderProducts, Shipped: true })
    }
    if (orderStatus == 'Canceled') {
      console.log('canceled called')
      res.render('user/view-order-products', { user: req.session.user, orderProducts, Canceled: true })
    }
    if (orderStatus == 'Delivered') {
      res.render('user/view-order-products', { user: req.session.user, orderProducts, Delivered: true })

    }


  })

})

router.get("/cancel-order-products/:id", verifySession, async (req, res, next) => {

  console.log('order Id')
  console.log(req.params.id)
  await userHelpers.cancelOrderProducts(req.params.id).then(() => {

    res.redirect('/orders')
  })


})
//sssssssssssssssssssssssssssssssssssssssssss

router.post('/verify-payment', verifySession, (req, res, next) => {
  console.log('payment verify called', req.body)
  userHelpers.verifyPayment(req.body).then(() => {
    console.log('payment verified')
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('status changed')
      res.json({ Razor_status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: '' })
  })

})


router.get("/user-profile", verifySession, async (req, res, next) => {
  userHelpers.getAllAddress(req.session.user).then((address) => {
    console.log(address)
    res.render('user/user-profile', { address, user: req.session.user, passChangeSuccess: req.flash('updateStatusSuccess'), passChangeFail: req.flash('updateStatusFail') })
  })


})

router.post("/change-password", verifySession, async (req, res, next) => {

  userHelpers.changePassword(req.body).then(() => {
    req.flash('updateStatusSuccess', 'Sussessfully updated')
    res.redirect('/user-profile')
  }).catch(() => {
    req.flash('updateStatusFail', 'Password cannot be matched')
    res.redirect('/user-profile')
  })

})

router.post("/add-address", verifySession, async (req, res, next) => {

  userHelpers.addAddress(req.body, req.session.user)

  res.redirect('/user-profile')
})



module.exports = router; 
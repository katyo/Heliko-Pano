var vendors = {
  webkit: '-webkit-',
  O: '-o-',
  MS:'-ms-',
  Moz:'-moz-'
};

function checkStyleProp(elm, sty, css, val){
  if(sty in elm.style){
    elm.style[sty] = val;
    val = global.getComputedStyle(elm).getPropertyValue(css);
    return und !== val && 'none' !== val;
  }
  return false;
}

function initStyleProp(sty, val){
  if(!global.getComputedStyle){
    return null;
  }

  var pfx,
      res = null,
      elm = doc.createElement('p'),
      css = sty.replace(/([A-Z])/g, '-$1').toLowerCase();

  /* Add it to the body to get the computed style.*/
  body.appendChild(elm);

  if(checkStyleProp(elm, sty, css, val)){
    res = {
      sty: sty,
      css: css
    };
  }else{
    sty = sty.charAt(0).toUpperCase() + sty.substr(1);
    css = '-' + css;

    for(pfx in vendors){
      if(checkStyleProp(elm, pfx + sty, vendors[pfx] + css, val)){
        res = {
          sty: pfx + sty,
          css: vendors[pfx] + css
        };
        break;
      }
    }
  }

  body.removeChild(elm);

  return res;
}

function dummy(){}

function bound(self, func){
  return function(){
    self.func.apply(self, arguments);
  };
}

function imagesLoad(urls, cb){
  var i = 0, /* Currently loading image */
      c = urls.length, /* Amount of images */
      u, /* current url */
      m; /* current image */

  function next(){
    if(i < c){
      u = urls[i];
      i++;
      m = new Image();
      m.src = u;
      cb(null, false, i, c, m); /* start loading notification */
      if(m.complete){
        pass();
      }else{
        m.onload = pass;
        m.onerror = fail;
      }
    }
  }

  function pass(){
    cb(null, true, i, c, m); /* complete loaded notification */
    next();
  }

  function fail(){
    cb(new Error('The image could not be loaded.'), true, i, c, m); /* loading error notification */
    next();
  }

  next();
}

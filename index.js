const IMAGE_SIZE = { width: 5958, height: 3977 };

function skyClipPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 1585);

  ctx.lineTo(365.39296874999997, 1580.2664062499998);
  ctx.lineTo(388.66640624999997, 1584.9210937499997);
  ctx.lineTo(421.24921874999995, 1552.33828125);
  ctx.lineTo(423.57656249999997, 1519.7554687499999);
  ctx.lineTo(442.19531249999994, 1519.7554687499999);
  ctx.lineTo(484.0874999999999, 1487.1726562499998);
  ctx.lineTo(484.0874999999999, 1452.2624999999998);
  ctx.lineTo(493.3968749999999, 1454.5898437499998);
  ctx.lineTo(542.27109375, 1410.3703124999997);
  ctx.lineTo(544.5984374999999, 1387.0968749999997);
  ctx.lineTo(560.88984375, 1389.42421875);
  ctx.lineTo(609.7640624999999, 1347.5320312499998);
  ctx.lineTo(605.1093749999999, 1324.2585937499998);
  ctx.lineTo(628.3828124999999, 1317.2765624999997);
  ctx.lineTo(691.2210937499999, 1266.0749999999998);
  ctx.lineTo(684.2390624999999, 1254.4382812499998);
  ctx.lineTo(2878.9242187499995, 1349.8593749999998);
  ctx.lineTo(2881.2515624999996, 1487.1726562499998);
  ctx.lineTo(2969.6906249999997, 1442.9531249999998);
  ctx.lineTo(2969.6906249999997, 1431.3164062499998);
  ctx.lineTo(2988.309375, 1422.0070312499997);
  ctx.lineTo(2992.9640624999997, 1422.0070312499997);
  ctx.lineTo(3083.7304687499995, 1373.1328124999998);
  ctx.lineTo(3093.03984375, 1361.4960937499998);
  ctx.lineTo(3100.0218749999995, 1359.1687499999998);
  ctx.lineTo(3113.9859374999996, 1356.8414062499999);
  ctx.lineTo(3197.7703124999994, 1312.6218749999998);
  ctx.lineTo(3197.7703124999994, 1294.0031249999997);
  ctx.lineTo(3218.7164062499996, 1287.0210937499999);
  ctx.lineTo(3228.0257812499995, 1294.0031249999997);
  ctx.lineTo(3328.1015624999995, 1238.146875);
  ctx.lineTo(3335.0835937499996, 1226.51015625);
  ctx.lineTo(3367.6664062499995, 1221.8554687499998);
  ctx.lineTo(3369.9937499999996, 1228.8374999999999);
  ctx.lineTo(5436.674999999999, 1296.6757812499998);
  ctx.lineTo(5473.912499999999, 1291.6757812499998);
  ctx.lineTo(5478.567187499999, 1584.9210937499997);
  ctx.lineTo(5920.762499999999, 1598.8851562499997);
  ctx.lineTo(5862.578906249999, 0);
  ctx.closePath();

  ctx.clip();
}

function headerText(ctx) {
  const headerColors = ['#3B8183', '#ED303C', '#F5634A', '#FF9C5B','#FAD089'];
  const elements = [
    { text: "AAATrucking", x: 400, y: 1250, size: 1000 },
    { text: ".biz", x: 4910, y: 960, size: 350 },
    { text: ".ru", x: 4910, y: 1280, size: 350 }
  ];
  const step = 20;

  elements.forEach(elem => {
    ctx.font = `${elem.size}px Bebas`;

    headerColors.forEach((color, i) => {
      const offset = (headerColors.length - i - 1) * step;
      ctx.fillStyle = color;
      ctx.fillText(elem.text, elem.x + offset, elem.y + offset);
    })
  })
}

function rotateAbout(cx, cy, angle, ctx) {
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.translate(-cx, -cy);
}

function containerText(text, cx, cy, size, font, ctx) {
  ctx.font = `${size}px "${font}"`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = "rgba(244, 243, 223, 0.66)";
  ctx.fillText(text, cx, cy);

  ctx.globalCompositeOperation = 'color';
  ctx.fillStyle = "rgba(244, 243, 223, 1)";
  ctx.fillText(text, cx, cy);
}

function containerTextFancy(text, cx, cy, size, font, ctx) {
  ctx.font = `${size}px "${font}"`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  ctx.fillStyle = '#F5634A';
  ctx.globalCompositeOperation = 'color';
  ctx.fillText(text, cx, cy);
}

function draw(ctx, ops) {
  ctx.save();

  ops.forEach(op => op(ctx));

  ctx.restore();
}

function drawPage(ctx, canvas, realCtx, scale, background, hovers) {
  ctx.drawImage(background, 0, 0, IMAGE_SIZE.width, IMAGE_SIZE.height);

  draw(ctx, [
    skyClipPath,
    headerText
  ]);

  draw(ctx, [
    rotateAbout.bind(null, 1808, 1583, Math.PI * 0.01),
    (hovers.watercooler ? containerTextFancy : containerText).bind(null, "watercooler.io", 1808, 1583, 100, 'Acknowledgement')
  ]);

  draw(ctx, [
    rotateAbout.bind(null, 1813, 2076, Math.PI * 0.01),
    (hovers.structuralists ? containerTextFancy : containerText).bind(null, "@structuralists", 1813, 2076, 100, 'Acknowledgement')
  ]);

  draw(ctx, [
    rotateAbout.bind(null, 1848, 2600, Math.PI * 0.005),
    (hovers.fixedIt ? containerTextFancy : containerText).bind(null, "Fixed it for You", 1848, 2600, 150, 'Capture')
  ])

  draw(ctx, [
    rotateAbout.bind(null, 4338, 1522, Math.PI * 0.01),
    (hovers.princessUnderwood ? containerTextFancy : containerText).bind(null, "The Princess Underwood", 4338, 1522, 100, 'Labor Union')
  ])

  realCtx.drawImage(canvas, 0, 0, IMAGE_SIZE.width * scale, IMAGE_SIZE.height * scale);
}

function loadAll(fonts, work) {
  if (fonts.length === 0) {
    work();
  } else {
    fonts[0].load().then(() => loadAll(fonts.slice(1), work))
  }
}

function positionLinks(scale) {
  links.forEach(link => {
    const a = document.querySelector(`a[href="${link.href}"]`);
    if (!a) { return; }
    a.style.left = `${link.left * scale}px`;
    a.style.top = `${link.top * scale}px`;
    a.style.width = `${link.width * scale}px`;
    a.style.height = `${link.height * scale}px`;
    a.style.transform = `rotate(${link.rotation}deg)`;
  })
}

const bebas = new FontFace('Bebas', 'url(Bebas-Regular.ttf)');
const acknowledgement = new FontFace('Acknowledgement', 'url(Acknowledgement.otf)');
const capture = new FontFace('Capture', 'url(Capture_it.ttf)');
const laborUnion = new FontFace('Labor Union', 'url(LaborUnion-Regular.otf)');

document.fonts.add(bebas);
document.fonts.add(acknowledgement);
document.fonts.add(capture);
document.fonts.add(laborUnion);

const links = [
  {
    href: 'http://watercooler.io',
    left: 740,
    top: 1330,
    width: 2100,
    height: 450,
    rotation: 2.3,
    key: 'watercooler'
  },
  {
    href: 'http://twitter.com/structuralists',
    left: 750,
    top: 1850,
    width: 2100,
    height: 450,
    rotation: 1.8,
    key: 'structuralists'
  },
  {
    href: 'https://chrome.google.com/webstore/detail/fixed-it-for-you/mcnbgfajpnepbbabimgmjjkalmcfhkhk',
    left: 740,
    top: 2370,
    width: 2100,
    height: 480,
    rotation: 1.3,
    key: 'fixedIt'
  },
  {
    href: 'https://princess-underwood-blog.tumblr.com',
    left: 3362,
    top: 1282,
    width: 2070,
    height: 470,
    rotation: 1.8,
    key: 'princessUnderwood'
  },
]

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container');
  const realCanvas = document.getElementById('canvas');

  const canvas = document.createElement('canvas');
  canvas.width = IMAGE_SIZE.width;
  canvas.height = IMAGE_SIZE.height;
  const ctx = canvas.getContext('2d');

  const background = new Image();
  background.src = "containers-blank.jpg";

  background.addEventListener('load', () => {
    loadAll([bebas, acknowledgement, capture, laborUnion], () => {
      const realCtx = realCanvas.getContext('2d');
      let rw = IMAGE_SIZE.width / window.innerWidth;
      let rh = IMAGE_SIZE.height / window.innerHeight;
      let scale = 1 / Math.min(rw, rh);
      realCanvas.width = IMAGE_SIZE.width * scale;
      realCanvas.height = IMAGE_SIZE.height * scale;

      const hovers = {
        watercooler: false,
        structuralists: false,
        fixedIt: false,
        princessUnderwood: false
      }

      links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.href;
        a.style.position = "absolute";
        a.style.display = "block";

        a.addEventListener('mouseenter', () => {
          hovers[link.key] = true;
          drawPage(ctx, canvas, realCtx, scale, background, hovers);
        })

        a.addEventListener('mouseout', () => {
          hovers[link.key] = false;
          drawPage(ctx, canvas, realCtx, scale, background, hovers);
        })

        container.appendChild(a);
      });
      positionLinks(scale);

      drawPage(ctx, canvas, realCtx, scale, background, hovers);

      window.addEventListener('resize', () => {
        rw = IMAGE_SIZE.width / window.innerWidth;
        rh = IMAGE_SIZE.height / window.innerHeight;
        scale = 1 / Math.min(rw, rh);
        realCanvas.width = IMAGE_SIZE.width * scale;
        realCanvas.height = IMAGE_SIZE.height * scale;

        drawPage(ctx, canvas, realCtx, scale, background, hovers);
        positionLinks(scale);
      });
    });
  });
});

console.log('Background image by Joseph Liu (https://unsplash.com/photos/rp8IVgYbLuI) used under the Unsplash License');
console.log('"Bebas" font by Flat-it (https://www.fontsquirrel.com/fonts/bebas) used under the Flat-it License v1.00');
console.log('"Acknowledgement" font by Reading Type (https://www.fontsquirrel.com/fonts/Acknowledgement) used under the SIL Open Font License v1.10');
console.log('"Capture It" font by Cpr.Sparhelt (https://www.fontsquirrel.com/fonts/Capture-it) used under the Cpr.Sparhelt font License v1.00');
console.log('"Labor Union" font by McLetters HAND-MADE TYPE (https://www.fontsquirrel.com/fonts/labor-union) used under the Tom McAuliffe EULA v1.00');

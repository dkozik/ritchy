/**
 * Created by admin on 27.06.2016.
 */
var Cube = function( container, parent, face1, face2, face3, face4 ) {
    var width = parent.clientWidth;
    var visible = false;
    var ang = 0;

    if (face1 instanceof Array || face1 instanceof NodeList) {
        face2=face1[1];
        face3=face1[2];
        face4=face1[3];
        face1=face1[0];
    }

    // 1. Подготовка сторон куба
    TweenMax.set(container, { perspective: '250px' });
    TweenLite.set(parent, { transformStyle : "preserve-3d", z:-width/2 });
//    TweenMax.to([face1, face2, face3, face4], 0, {autoAlpha : 0.5});
    TweenMax.to(face1, 0, { z: width/2 });
    TweenMax.to(face2, 0, { rotationY: -90, x : -width/2 });
    TweenMax.to(face3, 0, { rotationY: 180, z : -width/2 });
    TweenMax.to(face4, 0, { rotationY: 90, x : width/2 });
    TweenMax.to(parent, 0, { rotationY: 90, transformOrigin:"left top", x: -width });
    TweenMax.to(container, 0, { display: 'none' });


    var angleManager = new (function() {

        return {
            right: function() {
                ang+=90;
                return ang;
            },
            left: function() {
                ang-=90;
                return ang;
            },
            around: function() {
                ang+=360;
                return ang;
            },
            face: function( n ) {
                // 0..90..180..360
                var c = (ang / 90) % 4; // 0..1..2..3
                if (c!=n) {
                    // Есть два направления движения, нужно найти кратчайший
                    var v1,v2;
                    if (c>n) { // current > needed
                        v1 = n - c;
                        v2 = n + 4 - c;
                    } else { // c<n
                        v1 = n - 4 - c;
                        v2 = n - c;
                    }
                    // Сравниваем модули расстояний
                    ang = ang + (Math.abs(v1)<Math.abs(v2)?v1:v2)*90;
                }
                return ang;
            }
        }
    })();

    var rotateCube = function( ang, t1, t2, t3 ) {
        var tl = new TimelineLite();
        t1 = t1 || .2;
        t2 = t2 || .3;
        t3 = t3 || .5;
        tl.to([face1, face2, face3, face4], t1, {autoAlpha : 0.6})
          .to([face1, face2, face3, face4], t2, {autoAlpha : 1});
        TweenMax.to(parent, t3, { rotationY: ang,  transformOrigin:"50% 50%", ease: Back.easeOut.config(1.6) });
    };

    return {
        show: function() {
            if (!visible) {
                visible = true;
                var tl = new TimelineLite();
                tl.to(container, 0, { display: 'block' })
                    .to(container, .5, { autoAlpha: 1 });
                TweenMax.to(parent, .5, {rotationY:0, transformOrigin:"left top", x: 0, autoAlpha: 1});
            }
        },
        hide: function() {
            if (visible) {
                visible = false;
                var c = (ang / 90) % 4;
                var tl = new TimelineLite(), tl2 = new TimelineLite();
                // Подменяем угол поворота в диапазоне от 0..360 (если вдруг он был накручен)
                TweenMax.to(parent, 0, { rotationY: c*90, transformOrigin:"50% 50%" });
                if (c!=0) {
                    // Разворачиваем контейнер в нулевое положение
                    tl.to(parent, .2, { rotationY:0, transformOrigin:"50% 50%" });
                }
                // Убираем за край экрана поворачивая по левой кромке
                tl.to(parent, .3, { rotationY:90, transformOrigin:"left top", x: -width, autoAlpha:0 });

                tl2.to(container, .5, { autoAlpha: 0 })
                   .to(container, 0, {display: 'none'});

                ang = 0;
            }
        },
        rotateRight: function() {
            if (visible)
                rotateCube(angleManager.right());
        },
        rotateLeft: function() {
            if (visible)
                rotateCube(angleManager.left());
        },
        rotateToFace: function( n ) {
            if (visible)
                rotateCube(angleManager.face(n));
        },
        rotateAround: function() {
            if (visible)
                rotateCube(angleManager.around(), .5, .5, 1.2);
        },
        isVisible: function() {
            return visible;
        }
    }
}

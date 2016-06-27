/**
 * Created by admin on 27.06.2016.
 */
var Cube = function( container, parent, face1, face2, face3, face4 ) {
    var width = parent.clientWidth;
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

    var angleManager = new (function() {
        var ang = 0;

        return {
            right: function() {
                ang+=90;
                return ang;
            },
            left: function() {
                ang-=90;
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

    var rotateCube = function( ang ) {
//    TweenMax.to([face1, face2, face3, face4], 0.3, {autoAlpha : 0.1});
        TweenMax.to(parent, 0.5, { rotationY: ang,  ease: Back.easeOut.config(1.6) });
//    TweenMax.to([face1, face2, face3, face4], 1.5, {autoAlpha : 0.9});
    };

    return {
        rotateRight: function() {
            rotateCube(angleManager.right());
        },
        rotateLeft: function() {
            rotateCube(angleManager.left());
        },
        rotateToFace: function( n ) {
            rotateCube(angleManager.face(n));
        }
    }
}

import { DragControls } from './three.js-master/examples/jsm/controls/DragControls.js';


var renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.autoClear = false;
document.getElementById( 'MainThreeJS' ).appendChild( renderer.domElement );

var scene = new THREE.Scene();

const centralPoint = new THREE.Vector3( 0, 0, 0 );


// GLOBAL ILLUMINATION

scene.add( new THREE.AmbientLight( 0xD9D9D9 ) );


// PALLET

var palletGroup = new THREE.Group();

const palletWidth = 20;
const palletHeight = 40;
const palletDepth = 1;
var pallet = new THREE.Mesh(
    new THREE.BoxGeometry( palletWidth, palletHeight, palletDepth ), 
    new THREE.MeshBasicMaterial( { color: 0x888888 } )
);

// y = - palletDepth / 2, so that its upper surface is equal to y = 0
pallet.position.set( 0, - palletDepth / 2, 0 );
pallet.rotation.x = 90 * Math.PI / 180;
palletGroup.add(pallet);
scene.add( palletGroup );

var palletFrame = new THREE.LineSegments(
    new THREE.EdgesGeometry( pallet.geometry ), 
    new THREE.LineBasicMaterial( { color: 0x303030, linewidth: 1 } )
);
pallet.add( palletFrame );


// USED FOR CHECKING WHETHER A PACK IS PLACED WITHIN THE PALLET'S BOUNDARIES

function isPackWithinPallet( packPos, packGeoParam ) {

    let palletGeoParam = pallet.geometry.parameters;

    return (
        packPos.x - packGeoParam.width / 2 >= centralPoint.x - palletGeoParam.width / 2   && 
        packPos.x + packGeoParam.width / 2 <= centralPoint.x + palletGeoParam.width / 2   &&
        packPos.z - packGeoParam.height / 2 >= centralPoint.z - palletGeoParam.height / 2 && 
        packPos.z + packGeoParam.height / 2 <= centralPoint.z + palletGeoParam.height / 2
    );

}


// PACKAGES

var packs = []

class Pack extends THREE.Mesh {

    constructor( obj ) {

        var packGeo = new THREE.BoxGeometry( obj.width, obj.height, obj.depth )
        super(
            packGeo,
            new THREE.MeshLambertMaterial( { color: obj.color } )
        );

        var edgeGeo = new THREE.EdgesGeometry( packGeo );
        let edgeMat = new THREE.LineBasicMaterial({

          color: 0x000000

        });
        let edgeMesh = new THREE.LineSegments( edgeGeo, edgeMat );
        this.add( edgeMesh );
        
        this.originalPos = new THREE.Vector3( obj.posX, obj.posY, obj.posZ );
        this.lastPos = this.originalPos;

        this.position.set( obj.posX, obj.posY, obj. posZ );
        this.rotation.x = 90 * Math.PI / 180;

        // was the pack's last, static position on the sidebar?
        this.wasOnTheSidebar = false;

        palletGroup.add( this );
        packs.push( this );

    }

    updateLastPos() {

        this.lastPos.copy( this.position );

    }

    backToLastPos() {

        this.position.copy( this.lastPos );

    }

    sidebarOrNot() {

        this.wasOnTheSidebar = ! this.wasOnTheSidebar;

    }
}

// TEMPORARY

var pack1 = new Pack( {

    posX:   0,
    posY:   2,
    posZ:   0,
    width:  4,
    height: 4,
    depth:  4,
    color:  0xFF0000

} );

var pack2 = new Pack( {

    posX:   4,
    posY:   1.5,
    posZ:   15,
    width:  6,
    height: 4,
    depth:  3,
    color:  0x0000FF

} );


// PERSPECTIVE CAMERA

var cameraPerp = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );
scene.add( cameraPerp );

cameraPerp.position.set( 0, 40, 80 );
cameraPerp.lookAt( pallet.position );


// PALLETGROUP ROTATION CONTROLS

var lmbDown = false;

window.addEventListener( 'mousedown', function ( e ) {

    if (e.button == 0 ) {

        lmbDown = true;

    }

}, false );

window.addEventListener( 'mouseup', function ( e ) {

    if( e.button == 0 ) {

        lmbDown = false;

    }

}, false );

var rmbDown = false,
    mouseX = 0,
    mouseY = 0;

window.addEventListener( 'mousemove', function ( e ) {

    if ( ! rmbDown ) {

        return;

    }

    e.preventDefault();

    var deltaX = e.clientX - mouseX,
        deltaY = e.clientY - mouseY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    rotateScene( deltaX, deltaY );

}, false );

window.addEventListener( 'mouseup', function ( e ) {

    // if rmb is pressed and lmb is not pressed to prevent dragging and rotating at the same time
    if( e.button == 2 && ! lmbDown ) {

        e.preventDefault();

        rmbDown = false;

    }

}, false );

window.addEventListener( 'mousedown', function ( e ) {

    // if rmb is pressed and lmb is not pressed to prevent dragging and rotating at the same time
    if( e.button == 2 && ! lmbDown ) {

        e.preventDefault();

        rmbDown = true;

        mouseX = e.clientX;
        mouseY = e.clientY;

    }

}, false );



function rotateScene( deltaX, deltaY ) {

    palletGroup.rotation.y += deltaX / 100;
    palletGroup.rotation.x += deltaY / 100;

} 


// SIDEBAR

var sceneUI = new THREE.Scene();

var cameraOrth = new THREE.OrthographicCamera( -100, 100, 100, -100, -1, 0 );
cameraOrth.position.set( 0, 0, 0 );

var sidebarPoints = [];
const sidebarX = 65;
sidebarPoints.push( new THREE.Vector3( sidebarX, 100, 0 ) );
sidebarPoints.push( new THREE.Vector3( sidebarX, -100, 0 ) );

var sidebar = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints( sidebarPoints ), 
    new THREE.LineDashedMaterial( {

        color: 0x404040, 
        linewidth: 1,
        scale: 0.5,
        dashSize: 1.5,
        gapSize: 2

    } )
);
sidebar.computeLineDistances();
sceneUI.add( sidebar );


// CURRENT MOUSE POSITION

var mouse = new THREE.Vector2();
window.addEventListener( 'mousemove', onMouseMove );

function onMouseMove( event ) {

	mouse.x = (event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight ) * 2 + 1;

}


// RAYCASTING FROM MOUSE CURSOR, CURRENTLY USED FOR DRAGGING

var raycaster = new THREE.Raycaster();
var lastPackMousedOn;
window.addEventListener( 'mousemove', raycast );

function raycast() {

    raycaster.setFromCamera( mouse, cameraPerp );
    var intersects = raycaster.intersectObjects( packs );

    if( ! currentlyDragging ) {

        if( intersects.length > 0 ) {
    
            draggableObjects.length = 0;
    
            if( lastPackMousedOn ) {
    
                lastPackMousedOn.material.emissive.set( 0x000000 );
                
            }
    
            lastPackMousedOn = intersects[0].object;
            draggableObjects.push( lastPackMousedOn );
    
            lastPackMousedOn.material.emissive.set( 0x222222 );
    
        } else if( lastPackMousedOn ) {
    
            lastPackMousedOn.material.emissive.set( 0x000000 );
    
        }

    }

}


// DRAG CONTROLS

var draggableObjects = [];

var currentlyDragging = false;

var dragControls = new DragControls( draggableObjects, cameraPerp, renderer.domElement );

dragControls.addEventListener( 'dragstart', function( event ) {

    currentlyDragging = true;

} );

dragControls.addEventListener( 'dragend', function ( event ) {

    currentlyDragging = false;
    
    let pack = event.object;

    // moved onto the sidebar
    if( mouse.x * 100 >= sidebarX ) {

        if( !pack.wasOnTheSidebar ) {

            let worldPosition = pack.position;
            palletGroup.localToWorld( worldPosition );

            // to prevent it from flickering momentarily when adding to scene
            pack.matrixAutoUpdate = false;

            // removing the pack from the pallet by adding it to the scene, so that it doesn't
            // start rotating around the pallet's center
            scene.add( pack );

            let palletGroupRotation = new THREE.Euler();
            palletGroupRotation.copy( palletGroup.rotation );

            // all of this because the pallet is on its side
            palletGroupRotation.x += 90 * Math.PI / 180;
            let y = - palletGroupRotation.y;
            palletGroupRotation.y = palletGroupRotation.z;
            palletGroupRotation.z = y;

            pack.rotation.copy( palletGroupRotation );

            pack.position.copy( worldPosition );
            pack.matrixAutoUpdate = true;

            // copying the pallet's rotation with every frame
            pack.onBeforeRender = () => {

                let palletGroupRotation = new THREE.Euler();
                palletGroupRotation.copy( palletGroup.rotation );

                palletGroupRotation.x += 90 * Math.PI / 180;
                let y = - palletGroupRotation.y;
                palletGroupRotation.y = palletGroupRotation.z;
                palletGroupRotation.z = y;

                pack.rotation.copy( palletGroupRotation );
                
            }

            pack.sidebarOrNot();

        }

        pack.updateLastPos();

    
    } 
    // moved onto the pallet / empty space
    else {

        if( pack.wasOnTheSidebar ) {

            // if it was on the sidebar (not part of palletGroup), then we need to translate its world position
            // to palletGroup's local position to compare it to pallet's boundaries
            let packLocalPosition = pack.position;
            palletGroup.worldToLocal( packLocalPosition );

            if( isPackWithinPallet( packLocalPosition, pack.geometry.parameters ) ) {

                pack.updateLastPos();

                palletGroup.add( pack );
                
                pack.onBeforeRender = () => {
    
                }

                pack.rotation.copy( pallet.rotation );

                pack.sidebarOrNot();

            } else {

                pack.backToLastPos();

            }

        }
        else {

            if( isPackWithinPallet( pack.position, pack.geometry.parameters ) ) {

                pack.updateLastPos();

            } else {

                pack.backToLastPos();

            }

        }
    }

} );


// RENDERING

render();

function render() {

    renderer.render( scene, cameraPerp );
    renderer.render( sceneUI, cameraOrth );

    window.requestAnimationFrame( render );

}
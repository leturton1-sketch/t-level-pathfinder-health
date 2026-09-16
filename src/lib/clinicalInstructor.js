import * as T from "three";

// Metres, Y up, front +Z. A single coherent mesh assembly from all four views.
export function buildClinicalInstructor() {
  const root = new T.Group(); root.name = "Clinical instructor";
  const mats = {};
  for (const [name, colour, roughness, metalness] of [
    ["skin","#d89973",.78,0],["skinLight","#e3aa82",.75,0],["scrubs","#547dce",.86,0],
    ["seam","#395fa5",.9,0],["hair","#c69c4d",.92,0],["hairLight","#e4c474",.88,0],
    ["beard","#84603a",.96,0],["ink","#3f443c",.96,0],["black","#24282c",.8,0],
    ["white","#e9e7df",.82,0],["metal","#a8b5bc",.3,.8],["iris","#668d9d",.55,0]
  ]) mats[name] = new T.MeshStandardMaterial({color:colour,roughness,metalness});
  const sphere = new T.SphereGeometry(1,24,16);
  const add = (geo,mat,pos,scale=[1,1,1],parent=root) => {
    const m = new T.Mesh(geo,mats[mat] || mat); m.position.set(...pos); m.scale.set(...scale);
    m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
  };
  const ell = (mat,pos,scale,parent=root) => add(sphere,mat,pos,scale,parent);
  const tube = (pts,r,mat,parent=root) => add(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),Math.max(8,pts.length*5),r,6,false),mat,[0,0,0],[1,1,1],parent);
  const ring = (pos,r,thick,mat,parent=root) => add(new T.TorusGeometry(r,thick,8,32),mat,pos,[1,1,1],parent);
  const limb = (a,b,r1,r2,mat,parent=root) => {
    const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);
    const m=add(new T.CylinderGeometry(r2,r1,d.length(),16,3),mat,av.clone().add(bv).multiplyScalar(.5).toArray(),[1,1,1],parent);
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()); return m;
  };
  const torso = new T.LatheGeometry([
    new T.Vector2(.205,.85),new T.Vector2(.22,.87),new T.Vector2(.207,1.04),
    new T.Vector2(.235,1.22),new T.Vector2(.235,1.31),new T.Vector2(.19,1.36),
    new T.Vector2(.083,1.4)],40);
  add(torso,"scrubs",[0,0,0],[1,1,.61]);
  ell("scrubs",[0,.88,0],[.212,.115,.132]);
  limb([0,1.34,0],[0,1.5,0],.079,.076,"skin");
  // V neckline and visible undershirt.
  const neckline = new T.Shape(); neckline.moveTo(-.077,1.395); neckline.lineTo(0,1.285); neckline.lineTo(.077,1.395); neckline.closePath();
  add(new T.ShapeGeometry(neckline),"skin",[0,0,.145]);
  tube([[-.086,1.398,.137],[0,1.278,.153],[.086,1.398,.137]],.007,"seam");
  tube([[-.053,1.345,.15],[0,1.31,.155],[.053,1.345,.15]],.004,"white");
  for (const side of [-1,1]) {
    const x=side*.107;
    limb([x,.86,0],[side*.115,.49,.006],.108,.084,"scrubs");
    ell("scrubs",[side*.115,.49,.006],[.087,.097,.09]);
    limb([side*.115,.5,.006],[side*.12,.105,.008],.085,.068,"scrubs");
    // Cloth folds and outer leg seams.
    for (const y of [.16,.2,.47,.53,.79]) tube([[x-.052,y,.055],[x,y-.012,.084],[x+.05,y+.005,.052]],.0025,"seam");
    tube([[side*.202,.83,0],[side*.2,.5,.005],[side*.188,.12,.004]],.002,"seam");
    ell("black",[side*.12,.067,.04],[.086,.063,.151]);
    ell("white",[side*.12,.025,.045],[.089,.024,.155]);
    ell("white",[side*.12,.06,.153],[.079,.04,.048]);
    for(let j=0;j<5;j++) tube([[side*.12-.045,.112-j*.003,.027+j*.02],[side*.12+.044,.11-j*.003,.042+j*.02]],.003,"white");
    const a=[side*.218,1.305,0], b=[side*.277,1.16,0];
    limb(a,b,.097,.087,"scrubs");
    tube([[side*.22,1.36,-.02],[side*.265,1.29,.07],[side*.29,1.17,.065]],.0025,"seam");
    limb(b,[side*.285,.997,.012],.067,.054,"skin");
    ell("skin",[side*.285,.997,.012],[.054,.06,.052]);
    limb([side*.285,1,.012],[side*.303,.84,.027],.054,.037,"skinLight");
    const hand=ell("skin",[side*.302,.79,.032],[.044,.064,.025]);
    hand.rotation.z=side*.05;
    for(let i=0;i<4;i++) {
      const fx=side*(.271+i*.021), len=[.067,.081,.076,.056][i];
      limb([fx,.78,.033],[fx+side*.004,.78-len,.042],.011,.009,"skin");
      ell("skinLight",[fx+side*.004,.78-len,.042],[.009,.011,.01]);
    }
    limb([side*.269,.816,.042],[side*.248,.764,.07],.017,.011,"skin");
    // Pockets follow the chest surface.
    tube([[side*.045,.99,.128],[side*.045,.884,.14],[side*.17,.885,.104],[side*.177,.99,.103]],.0025,"seam");
    tube([[side*.045,.99,.128],[side*.177,.99,.103]],.004,"seam");
  }
  tube([[-.192,.872,.06],[0,.864,.14],[.192,.872,.06]],.003,"seam");
  const head = new T.Group(); head.position.y=1.48; root.add(head);
  ell("skin",[0,.126,0],[.092,.132,.09],head);
  ell("skinLight",[0,.09,.043],[.081,.092,.058],head);
  for(const s of [-1,1]) {
    ell("skin",[s*.094,.115,0],[.023,.041,.018],head);
    ell("skinLight",[s*.099,.119,.014],[.013,.027,.007],head);
    ring([s*.099,.093,.018],.010,.003,"metal",head);
    ell("black",[s*.099,.093,.018],[.007,.007,.002],head);
    ell("skinLight",[s*.041,.123,.074],[.034,.023,.015],head);
    ell("white",[s*.039,.132,.084],[.024,.014,.009],head);
    ell("iris",[s*.039,.132,.092],[.010,.010,.002],head);
    ell("black",[s*.039,.132,.094],[.0045,.006,.002],head);
    ell("white",[s*.036,.136,.096],[.0025,.0025,.001],head);
    tube([[s*.015,.154,.087],[s*.036,.159,.09],[s*.062,.153,.079]],.004,"beard",head);
    ring([s*.039,.131,.103],.031,.0028,"black",head);
    tube([[s*.07,.137,.102],[s*.089,.141,.065],[s*.101,.135,.004]],.0026,"black",head);
    // Beard cheek and sideburn silhouette.
    ell("beard",[s*.06,.064,.061],[.023,.049,.025],head);
    ell("beard",[s*.075,.095,.018],[.009,.046,.025],head);
  }
  tube([[-.008,.135,.106],[0,.141,.11],[.008,.135,.106]],.0025,"metal",head);
  ell("skinLight",[0,.117,.092],[.013,.031,.018],head);
  ell("skin",[0,.096,.108],[.02,.012,.015],head);
  ell("beard",[0,.026,.066],[.064,.047,.038],head);
  ell("skin",[0,.061,.089],[.028,.01,.008],head);
  tube([[-.027,.062,.096],[0,.056,.101],[.027,.062,.096]],.0025,"beard",head);
  for(const s of [-1,1]) ell("beard",[s*.021,.077,.096],[.025,.010,.013],head);
  // Individual curved locks, deterministic placement, no random change on reload.
  ell("beard",[0,.21,-.012],[.091,.07,.081],head);
  for(let i=0;i<95;i++) {
    const phi=i*2.399963, radial=Math.sqrt((i+.5)/95), xx=Math.cos(phi)*radial*.093, zz=Math.sin(phi)*radial*.081;
    const yy=.205+Math.sqrt(1-radial*radial)*.067;
    tube([[xx,yy,zz],[xx+.008,yy+.018,zz+.008],[xx+.014,yy+.025,zz+.017]],.0035,i%3===0?"hairLight":"hair",head);
  }
  for(let i=0;i<45;i++) {
    const ang=i*2.399963, rr=Math.sqrt((i+.5)/45);
    const xx=Math.cos(ang)*rr*.055, yy=.027+Math.sin(ang)*rr*.031;
    tube([[xx,yy+.012,.095],[xx*.98,yy,.104],[xx*.9,yy-.009,.1]],.0015,i%4===0?"hair":"beard",head);
  }
  // Botanical neck tattoo wraps continuously; sun and crescent hand tattoos.
  for(let i=0;i<24;i++) {
    const a=i*Math.PI/12, p=(r,y,off=0)=>[Math.sin(a+off)*r,y,Math.cos(a+off)*r];
    tube([p(.079,1.397),p(.081,1.427,.025),p(.078,1.462,0)],.0015,"ink");
    tube([p(.08,1.425),p(.082,1.44,.08),p(.079,1.452,0)],.0013,"ink");
  }
  ring([-.303,.795,.059],.017,.0015,"ink");
  for(let i=0;i<12;i++) { const a=i*Math.PI/6; tube([[-.303+Math.cos(a)*.02,.795+Math.sin(a)*.02,.059],[-.303+Math.cos(a)*.029,.795+Math.sin(a)*.029,.058]],.0013,"ink"); }
  const crescent=[]; for(let i=0;i<=22;i++) {const a=.6+i/22*5.1;crescent.push([.303+Math.cos(a)*.021,.795+Math.sin(a)*.023,.059]);} tube(crescent,.002,"ink");
  // Stethoscope: tubing passes behind neck and hangs over the scrub front.
  tube([[-.075,1.395,.03],[-.073,1.425,-.053],[0,1.438,-.084],[.075,1.425,-.045],[.086,1.355,.11],[.09,1.215,.156],[.04,1.187,.16],[.012,1.217,.161]],.005,"black");
  tube([[-.075,1.395,.03],[-.094,1.342,.1],[-.104,1.286,.145]],.005,"black");
  tube([[-.104,1.286,.145],[-.103,1.258,.15],[-.075,1.243,.15]],.0035,"metal");
  ell("metal",[.012,1.219,.163],[.015,.015,.005]);
  ell("black",[.012,1.219,.169],[.011,.011,.002]);
  const canvas=document.createElement("canvas"); canvas.width=512;canvas.height=192;
  const ctx=canvas.getContext("2d");ctx.fillStyle="#f7f7ef";ctx.fillRect(0,0,512,192);
  ctx.fillStyle="#31518a";ctx.fillRect(0,0,512,30);ctx.fillStyle="#172331";ctx.font="bold 66px sans-serif";ctx.textAlign="center";ctx.fillText("Instructor",256,116);
  ctx.font="23px sans-serif";ctx.fillText("PATHFINDER HEALTH",256,160);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const badge=new T.MeshStandardMaterial({map:texture,roughness:.75});
  const badgeMesh=add(new T.BoxGeometry(.104,.041,.004),badge,[-.128,1.327,.133]);badgeMesh.rotation.z=.06;
  add(new T.BoxGeometry(.014,.016,.006),"metal",[-.127,1.351,.132]);
  // Lightweight animation rig. Existing meshes are re-parented without changing
  // their world position, so the character keeps the four-view silhouette while
  // gaining shoulder, elbow and wrist articulation for conversational gestures.
  const makeJoint = (name, pivot, objects, parent=root) => {
    const joint = new T.Group(); joint.name=name; joint.position.set(...pivot);
    root.add(joint); root.updateMatrixWorld(true);
    objects.forEach(object => joint.attach(object));
    if(parent!==root) { root.updateMatrixWorld(true); parent.attach(joint); }
    return joint;
  };
  const bodyMeshes=root.children.filter(object=>object.isMesh);
  const armMeshes=(side, maxY=1.39, minY=.7)=>bodyMeshes.filter(object=>{
    const x=object.position.x, y=object.position.y;
    return Math.sign(x)===side && Math.abs(x)>.18 && y>=minY && y<=maxY;
  });
  const leftArm=armMeshes(-1), rightArm=armMeshes(1);
  const leftForearm=armMeshes(-1,1.18,.7), rightForearm=armMeshes(1,1.18,.7);
  const leftHand=armMeshes(-1,.87,.69), rightHand=armMeshes(1,.87,.69);
  const leftShoulder=makeJoint("leftShoulder",[-.218,1.305,0],leftArm);
  const rightShoulder=makeJoint("rightShoulder",[.218,1.305,0],rightArm);
  const leftElbow=makeJoint("leftElbow",[-.277,1.16,0],leftForearm,leftShoulder);
  const rightElbow=makeJoint("rightElbow",[.277,1.16,0],rightForearm,rightShoulder);
  const leftWrist=makeJoint("leftWrist",[-.303,.86,.027],leftHand,leftElbow);
  const rightWrist=makeJoint("rightWrist",[.303,.86,.027],rightHand,rightElbow);
  root.userData.rig={head,leftShoulder,rightShoulder,leftElbow,rightElbow,leftWrist,rightWrist};
  root.userData.description="Animated procedural clinical instructor based on supplied four-view reference and video gesture study";
  return root;
}

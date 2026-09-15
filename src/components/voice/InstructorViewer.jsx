import { useEffect, useRef, useState } from "react";
import { buildClinicalInstructor } from "@/lib/clinicalInstructor";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./InstructorViewer.css";

export default function InstructorViewer({ state="idle", speaking=false, listening=false }) {
  const mount=useRef(null), api=useRef(null);
  const [phase,setPhase]=useState("loading"),[retry,setRetry]=useState(0),[exporting,setExporting]=useState(false),[exportError,setExportError]=useState("");
  useEffect(()=>{
    let renderer,controls,observer,intersection,scene,model,disposed=false,frame=0,visible=true;
    const host=mount.current;
    setPhase("loading");
    const render=()=>{frame=0;if(!disposed && visible && !document.hidden && renderer)renderer.render(scene,camera);};
    const request=()=>{if(!frame && !disposed)frame=requestAnimationFrame(render);};
    const camera=new T.PerspectiveCamera(32,1,.01,30);
    const visibility=()=>request();
    const lost=(event)=>{event.preventDefault();setPhase("error");};
    try {
      renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.75));
      renderer.setClearColor(0,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
      renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
      renderer.domElement.setAttribute("aria-label","3D clinical instructor. Drag to rotate, pinch or scroll to zoom. Use the view buttons for keyboard control.");
      renderer.domElement.addEventListener("webglcontextlost",lost);
      host.appendChild(renderer.domElement);scene=new T.Scene();
      scene.add(new T.HemisphereLight(0xe7f0ff,0x8a7a6a,2));
      const key=new T.DirectionalLight(0xffecd8,3.2);key.position.set(-2,4,3);key.castShadow=true;
      key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-1.2;key.shadow.camera.right=1.2;
      key.shadow.camera.top=2.4;key.shadow.camera.bottom=-1;key.shadow.normalBias=.015;scene.add(key);
      const fill=new T.DirectionalLight(0xc9ddff,1.5);fill.position.set(2,2,-2);scene.add(fill);
      model=buildClinicalInstructor();scene.add(model);
      const ground=new T.Mesh(new T.PlaneGeometry(5,5),new T.ShadowMaterial({opacity:.14}));
      ground.rotation.x=-Math.PI/2;ground.position.y=-.002;ground.receiveShadow=true;scene.add(ground);
      controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.9,0);
      controls.enablePan=false;controls.enableDamping=false;controls.minDistance=1.45;controls.maxDistance=5;
      controls.minPolarAngle=.35;controls.maxPolarAngle=Math.PI*.65;controls.addEventListener("change",request);
      const view=(angle=0)=>{camera.position.set(Math.sin(angle)*3.65,1.15,Math.cos(angle)*3.65);controls.target.set(0,.9,0);controls.update();request();};
      api.current={view,model,zoom:(factor)=>{const direction=camera.position.clone().sub(controls.target);direction.setLength(T.MathUtils.clamp(direction.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(direction);controls.update();request();}};
      observer=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();request();});
      observer.observe(host);
      intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)request();});
      intersection.observe(host);document.addEventListener("visibilitychange",visibility);view();setPhase("ready");
    } catch(error) { console.error("Instructor viewer could not start",error);setPhase("error"); }
    return ()=>{
      disposed=true;cancelAnimationFrame(frame);api.current=null;observer?.disconnect();intersection?.disconnect();
      document.removeEventListener("visibilitychange",visibility);controls?.dispose();
      const geometries=new Set(),materials=new Set(),textures=new Set();
      scene?.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));});
      materials.forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)textures.add(v);});m.dispose();});
      textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());
      if(renderer){renderer.domElement.removeEventListener("webglcontextlost",lost);renderer.dispose();renderer.domElement.remove();}
    };
  },[retry]);
  const exportModel=async()=>{
    if(!api.current)return;setExporting(true);setExportError("");
    try {
      const {GLTFExporter}=await import("three/examples/jsm/exporters/GLTFExporter.js");
      const data=await new GLTFExporter().parseAsync(api.current.model,{binary:true});
      const url=URL.createObjectURL(new Blob([data],{type:"model/gltf-binary"}));
      const link=document.createElement("a");link.href=url;link.download="pathfinder-clinical-instructor.glb";link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
    }catch {setExportError("The model could not be downloaded. Please try again.");}
    finally{setExporting(false);}
  };
  const label=listening?"Listening…":speaking?"Educator speaking…":state==="working"?"Preparing your response…":state==="offline"?"Assistant unavailable":"Ready to help";
  return <div className="pf-instructor">
    <div className="pf-instructor-title"><span>Clinical Educator</span><small role="status">{label}</small></div>
    <div ref={mount} className="pf-instructor-canvas" />
    {phase!=="ready" && <div className="pf-instructor-fallback" role="status">
      {phase==="loading"?"Preparing your instructor…":<><p>The 3D view is unavailable. Chat and voice are still available.</p><button type="button" onClick={()=>setRetry(n=>n+1)}>Retry 3D view</button></>}
    </div>}
    <div className="pf-instructor-controls" aria-label="Instructor view controls">
      {[["Front",0],["Left",Math.PI/2],["Back",Math.PI],["Right",-Math.PI/2]].map(([label,angle])=><button type="button" key={label} disabled={phase!=="ready"} onClick={()=>api.current?.view(angle)}>{label}</button>)}
      <button type="button" disabled={phase!=="ready"} onClick={()=>api.current?.zoom(.8)} aria-label="Zoom in">+</button>
      <button type="button" disabled={phase!=="ready"} onClick={()=>api.current?.zoom(1.25)} aria-label="Zoom out">−</button>
      <button type="button" disabled={phase!=="ready"} onClick={()=>api.current?.view()}>Reset view</button>
    </div>
    <p className="pf-instructor-hint">Drag to rotate · Pinch or scroll to zoom</p>
    <button className="pf-instructor-download" type="button" disabled={phase!=="ready"||exporting} onClick={exportModel}>{exporting?"Preparing model…":"Download 3D model"}</button>
    {exportError && <p role="alert">{exportError}</p>}
  </div>;
}

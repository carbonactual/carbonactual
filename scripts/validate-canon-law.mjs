import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const REQUIRED_FILES=[".github/CANON_LAW.md","architecture/CARBON_ACTUAL_AODS_CANON.md","architecture/CARBON_ACTUAL_HAPI_WORLD_TIER_II.md","architecture/audubon-plate-manifest.json","architecture/CARBON_ACTUAL_REPOSITORY_CANON_MANIFEST.json"];

export async function validateRepoCanon(rootDir=process.cwd()){
  const violations=[];
  const read=async rel=>{try{return await readFile(path.join(rootDir,rel),"utf8")}catch{violations.push("missing:"+rel);return null}};
  for(const f of REQUIRED_FILES) await read(f);
  const mText=await read("architecture/audubon-plate-manifest.json");
  if(mText){
    let m; try{m=JSON.parse(mText)}catch{violations.push("invalid-json:plate-manifest")}
    if(m){
      if(m.authority!=="carbonactual/hapi-world/CANON.md") violations.push("plate-authority");
      if(m.plate_range?.min!==1||m.plate_range?.max!==435) violations.push("plate-range");
      if(!Array.isArray(m.plates)||m.plates.length!==435) violations.push("plate-count");
      const nums=m.plates?.map(p=>p.number)??[];
      if(new Set(nums).size!==435) violations.push("duplicate-plates");
      for(let i=1;i<=435;i++) if(nums[i-1]!==i) violations.push("plate-order:"+i);
      for(const n of [1,12,66,72,311,431]){
        const p=m.plates.find(x=>x.number===n);
        if(!p||p.status!=="curated_anchor"||!p.name||!p.family||!p.habitat) violations.push("anchor:"+n);
      }
    }
  }
  const law=await read(".github/CANON_LAW.md");
  for(const t of ["HAPI World CANON.md","AODS","435","unknown does not imply malicious"]) if(law&&!law.includes(t)) violations.push("law-marker:"+t);
  const aods=await read("architecture/CARBON_ACTUAL_AODS_CANON.md");
  for(const t of ["435-plate coverage","Eight working habitat families","60/30/10","AODS never overrides identity"]) if(aods&&!aods.includes(t)) violations.push("aods-marker:"+t);
  const tier=await read("architecture/CARBON_ACTUAL_HAPI_WORLD_TIER_II.md");
  for(const t of ["BUNK","Io","ASH / ECHO / PHOENIX","#R9","ABBA"]) if(tier&&!tier.includes(t)) violations.push("tier-marker:"+t);
  return {passed:violations.length===0,violations};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const r=await validateRepoCanon();
  if(!r.passed){console.error("CANON_LAW_VIOLATION");for(const v of r.violations) console.error(v);process.exitCode=1}
  else console.log("CANON_LAW_CONFORMANCE_PASSED");
}

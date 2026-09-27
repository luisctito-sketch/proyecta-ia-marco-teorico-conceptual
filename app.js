const $ = id => document.getElementById(id);
const normalize = s => (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const words = s => (s||"").match(/\b[\p{L}\p{N}][\p{L}\p{N}-]*\b/gu)||[];
const paragraphs = s => (s||"").split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
const bulletRegex = /^\s*(?:[-•*]|\d+[.)])\s+/m;
const firstPersonRegex = /\b(yo|nosotros|nosotras|mi|mis|nuestro|nuestra|nuestros|nuestras|considero|consideramos|creo|creemos|en mi opinion|a mi juicio|para mi)\b/i;
const directQuoteRegex = /[“"][^”"]+[”"]/;
const apaParentheticalRegex = /\([A-ZÁÉÍÓÚÑa-záéíóúñ][^)]*,\s*(?:19|20)\d{2}(?:,\s*p{1,2}\.\s*\d+(?:[-–]\d+)?)?\)/;
const narrativeRegex = /\b[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ-]+\s*\((?:19|20)\d{2}\)/;
const esc = s => (s||"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function show(el, cls, html){el.className=`output-box ${cls}`;el.innerHTML=html;el.classList.remove("hidden");}
function unique(arr){return [...new Set(arr.map(x=>x.trim()).filter(Boolean))]}
function titleCase(s){return (s||"").trim().replace(/\b\p{L}/gu,m=>m.toUpperCase());}

const preservedPhrases = [
  "internet de las cosas","inteligencia artificial","visión artificial","vision artificial","control automático","control automatico",
  "teoría de control moderno","teoria de control moderno","electrónica embebida","electronica embebida","sistemas embebidos","redes de computadoras",
  "procesamiento digital de señales","comunicaciones inalámbricas","comunicaciones inalambricas","variables medioambientales","variable medioambiental",
  "consumo de energía eléctrica","consumo de energia electrica","sistema electrónico","sistema electronico","sistema de control","sistema de monitoreo",
  "modelo matemático","modelo matematico","lógica difusa","logica difusa","aprendizaje automático","aprendizaje automatico","energía eléctrica","energia electrica",
  "telecomunicaciones","electromedicina","instrumentación biomédica","instrumentacion biomedica","automatización industrial","automatizacion industrial",
  "redes inalámbricas","redes inalambricas","comunicación digital","comunicacion digital","procesamiento de imágenes","procesamiento de imagenes",
  "sensores","actuadores","microcontroladores","plc","control pid","agricultura protegida","invernadero"
];
const stopWords = new Set([
  "el","la","los","las","un","una","unos","unas","de","del","al","y","e","o","u","en","para","por","con","sin","sobre","entre","que","se","su","sus","este","esta","estos","estas","a","como","mediante","dentro","más","mas","menos","muy","respectivo","proyecto","grado","presente","fin","forma","manera","parte","nivel","caso","ciudad","bolivia","objetivo","general","especifico","específico","realizar","permitir","medir","medicion","medición","informacion","información","datos","sistema","prototipo","desarrollo","diseño","diseno","aplicacion","aplicación","colegio","empresa","institucion","institución","zona","area","área"
]);
const verbStems = ["desarroll","diseñ","disen","implement","analiz","identific","determ","evalu","valid","verific","compar","seleccion","med","monitore","realiz","constru","integr","program","model","simul","caracteriz","propon","establec","aplic","optimiz","diseñ","controlar"];
function extractCandidates(){
  const raw=[$("generalObjective").value,$("specificObjectives").value].join(" ").trim();
  if(!raw) return [];
  const n=normalize(raw), found=[];
  preservedPhrases.forEach(p=>{if(n.includes(normalize(p))) found.push(p)});
  const toks=words(raw).map(x=>normalize(x));
  toks.forEach(t=>{
    if(t.length<5||stopWords.has(t)||verbStems.some(v=>t.startsWith(v))||/^(19|20)\d{2}$/.test(t)) return;
    if(found.some(p=>normalize(p).includes(t))) return;
    found.push(t);
  });
  return unique(found).slice(0,22);
}

$("extractTermsBtn").addEventListener("click",()=>{
  const terms=extractCandidates();
  if(!terms.length){alert("Escribe primero el Objetivo General y los Objetivos Específicos.");return;}
  $("candidateTerms").innerHTML=terms.map((t,i)=>`<label class="chip"><input type="checkbox" value="${esc(t)}" ${i<10?"checked":""}> ${esc(t)}</label>`).join("");
  $("candidateBox").classList.remove("hidden");
});
$("clearStructureBtn").addEventListener("click",()=>{
  ["projectTitle","generalObjective","specificObjectives","manualTerms"].forEach(id=>$(id).value="");
  $("candidateTerms").innerHTML="";$("candidateBox").classList.add("hidden");$("structureOutput").classList.add("hidden");
});

function structureLines(terms,deep){
  const lines=["CAPÍTULO II. MARCO TEÓRICO Y CONCEPTUAL"];
  terms.forEach((t,i)=>{
    const n=i+1, upper=t.toUpperCase();
    lines.push(`2.${n}. ${upper}`);
    lines.push(`2.${n}.1. DEFINICIÓN Y FUNDAMENTOS DE ${upper}`);
    lines.push(`2.${n}.2. PRINCIPIOS, MODELOS O CLASIFICACIÓN DE ${upper}`);
    if(deep){
      lines.push(`2.${n}.2.1. Características, variables o elementos de ${t}`);
      lines.push(`2.${n}.2.1.1. Parámetros o criterios técnicos asociados a ${t}`);
    }
    lines.push(`2.${n}.3. APLICACIÓN DE ${upper} EN EL CONTEXTO DEL PROYECTO`);
  });
  return lines;
}
function renderStructure(terms,deep){
  let html=`<div class="model-warning"><strong>MODELO TENTATIVO:</strong> este índice es solo un ejemplo de organización. Debes quitar, fusionar, cambiar de orden o añadir temas según tu proyecto, tus objetivos y las fuentes realmente disponibles.</div><div class="structure-tree"><div class="chapter">CAPÍTULO II. MARCO TEÓRICO Y CONCEPTUAL</div>`;
  terms.forEach((t,i)=>{
    const n=i+1, upper=esc(t.toUpperCase()), plain=esc(t);
    html+=`<div class="l2">2.${n}. ${upper}</div><div class="l3">2.${n}.1. DEFINICIÓN Y FUNDAMENTOS DE ${upper}</div><div class="l3">2.${n}.2. PRINCIPIOS, MODELOS O CLASIFICACIÓN DE ${upper}</div>`;
    if(deep) html+=`<div class="l4">2.${n}.2.1. Características, variables o elementos de ${plain}</div><div class="l5">2.${n}.2.1.1. Parámetros o criterios técnicos asociados a ${plain}</div>`;
    html+=`<div class="l3">2.${n}.3. APLICACIÓN DE ${upper} EN EL CONTEXTO DEL PROYECTO</div>`;
  });
  return html+`</div><div class="tip-box"><strong>Antes del 2.1:</strong> redacta uno o dos párrafos introductorios del capítulo. No coloques directamente el primer subtítulo después del título del capítulo.</div>`;
}
$("buildStructureBtn").addEventListener("click",()=>{
  const selected=[...document.querySelectorAll("#candidateTerms input:checked")].map(x=>x.value);
  const manual=$("manualTerms").value.split(",").map(x=>x.trim()).filter(Boolean);
  const terms=unique([...selected,...manual]).slice(0,12);
  if(!terms.length){alert("Selecciona o añade al menos un concepto.");return;}
  const deep=$("detailLevel").value==="deep";
  show($("structureOutput"),"ok",`<h4>🟢 Índice tentativo propuesto</h4>${renderStructure(terms,deep)}`);
  $("chapterStructure").value=structureLines(terms,deep).join("\n");
});

function connectorCount(text){
  const con=["además","asimismo","de igual manera","por otra parte","sin embargo","no obstante","en consecuencia","por consiguiente","es decir","en otras palabras","del mismo modo","respecto de","con relación a","referente a","en primer lugar","por ejemplo","en particular","como resultado","por esta razón"];
  const n=normalize(text);return con.filter(c=>n.includes(normalize(c))).length;
}
$("reviewParagraphBtn").addEventListener("click",()=>{
  const text=$("paragraphText").value.trim(), external=$("usesExternalIdea").checked, el=$("paragraphOutput");
  if(!text){show(el,"bad","<h4>🔵 FALTA INFORMACIÓN</h4><p>Pega un párrafo completo.</p>");return;}
  const wc=words(text).length, pcs=paragraphs(text).length, hasBullet=bulletRegex.test(text), first=firstPersonRegex.test(text), connectors=connectorCount(text), hasCitation=apaParentheticalRegex.test(text)||narrativeRegex.test(text), hasQuote=directQuoteRegex.test(text), hasPage=/\bp{1,2}\.\s*\d+/i.test(text);
  const good=[],issues=[];
  if(pcs===1) good.push("Se detecta un solo párrafo."); else issues.push(`Se detectan ${pcs} bloques; comprueba la unidad del párrafo.`);
  if(wc<=145) good.push(`Extensión aproximada: ${wc} palabras; no se detecta una alerta evidente respecto al máximo aproximado de 10 líneas.`); else issues.push(`El párrafo tiene ${wc} palabras y podría superar aproximadamente 10 líneas. Condénsalo y verifica visualmente en Word.`);
  if(!hasBullet) good.push("No se detectan viñetas dentro del párrafo."); else issues.push("Se detectan viñetas/listas. En la explicación principal debe predominar la redacción científica continua.");
  if(!first) good.push("No se detectan formas evidentes de primera persona."); else issues.push("Se detecta primera persona u opinión personal. Prefiere tercera persona o forma impersonal.");
  if(connectors>=1) good.push(`Se detectan ${connectors} conectores discursivos.`); else issues.push("No se detectan conectores claros; revisa la cohesión lógica.");
  if(external&&hasCitation) good.push("Se detecta una forma de cita autor-año.");
  if(external&&!hasCitation) issues.push("Marcaste que el párrafo utiliza una fuente externa, pero no se detecta cita autor-año.");
  if(hasQuote&&!hasPage) issues.push("Se detecta texto entre comillas, pero no una página en formato p./pp.; revisa la cita textual.");
  if(hasQuote&&hasPage) good.push("La cita textual parece incluir página.");
  show(el,issues.length?"warn":"ok",`<h4>${issues.length?"🟡 REVISAR":"🟢 CUMPLE FORMALMENTE"}</h4><div class="metric-grid"><div><span>Palabras</span><strong>${wc}</strong></div><div><span>Párrafos</span><strong>${pcs}</strong></div><div><span>Conectores</span><strong>${connectors}</strong></div><div><span>Cita</span><strong>${hasCitation?"Sí":"No"}</strong></div></div><strong>Fortalezas</strong><ul class="review-list">${good.map(x=>`<li class="good">${x}</li>`).join("")}</ul>${issues.length?`<strong>Qué revisar</strong><ul class="review-list">${issues.map(x=>`<li class="warn">${x}</li>`).join("")}</ul>`:""}<p class="small">La herramienta revisa señales formales; no certifica la autenticidad de una fuente ni la fidelidad conceptual respecto al autor.</p>`);
});

function similarity(a,b){const stop=new Set(["el","la","los","las","un","una","de","del","al","y","o","en","para","por","con","sin","que","se","su","sus","es","son","fue","como"]);const tok=s=>normalize(s).replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(x=>x.length>3&&!stop.has(x));const A=tok(a),B=tok(b),setA=new Set(A),setB=new Set(B);if(!setA.size||!setB.size)return 0;let inter=0;setA.forEach(x=>{if(setB.has(x))inter++});return inter/Math.min(setA.size,setB.size)}
function sharedPhrases(a,b){const A=normalize(a).replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(Boolean),B=normalize(b),found=[];for(let n=6;n>=3;n--){for(let i=0;i<=A.length-n;i++){const g=A.slice(i,i+n).join(" ");if(g.length>13&&B.includes(g)&&!found.some(x=>x.includes(g)||g.includes(x)))found.push(g);if(found.length>=6)break}if(found.length>=6)break}return found}
$("compareTextsBtn").addEventListener("click",()=>{
  const src=$("sourceOriginal").value.trim(),stu=$("studentVersion").value.trim(),author=$("sourceAuthor").value.trim(),year=$("sourceYear").value.trim(),page=$("sourcePage").value.trim(),el=$("comparisonOutput");
  if(!src||!stu){show(el,"bad","<h4>🔵 FALTA INFORMACIÓN</h4><p>Pega el fragmento original y la versión del estudiante.</p>");return;}
  const sim=similarity(src,stu),pct=Math.round(sim*100),citationDetected=apaParentheticalRegex.test(stu)||narrativeRegex.test(stu),quote=directQuoteRegex.test(stu),phrases=sharedPhrases(src,stu),issues=[],good=[];
  if(sim>=.70&&!quote)issues.push(`Coincidencia léxica muy alta (${pct}%). Reestructura la idea completamente, no solo sustituyas palabras.`);else if(sim>=.50&&!quote)issues.push(`Coincidencia moderada-alta (${pct}%). La paráfrasis conserva demasiada estructura del original.`);else good.push(`Coincidencia aproximada: ${pct}%. No se detecta por sí sola una similitud extrema.`);
  if(citationDetected)good.push("Se detecta una cita autor-año.");else issues.push("No se detecta cita autor-año. Una idea parafraseada también debe reconocer la fuente.");
  if(quote&&!page)issues.push("Parece existir cita textual, pero no proporcionaste página.");if(!author||!/\d{4}/.test(year))issues.push("Completa autor y año reales.");
  const ph=phrases.length?`<p><strong>Secuencias idénticas que conviene revisar:</strong></p><div class="chips">${phrases.map(p=>`<span class="chip">${esc(p)}</span>`).join("")}</div>`:"";
  show(el,issues.length?"warn":"ok",`<h4>${issues.length?"🟡 ORIENTACIÓN DE INTEGRIDAD":"🟢 REVISIÓN FORMAL FAVORABLE"}</h4><p><strong>Coincidencia aproximada:</strong> ${pct}%</p>${ph}${good.length?`<ul class="review-list">${good.map(x=>`<li class="good">${x}</li>`).join("")}</ul>`:""}${issues.length?`<ul class="review-list">${issues.map(x=>`<li class="warn">${x}</li>`).join("")}</ul>`:""}<p class="small"><strong>No es un detector de plagio.</strong> Es una alerta pedagógica local.</p>`);
});

function hasIntroBefore21(sample){
  const t=sample.trim();if(!t)return false;
  const idx=t.search(/(^|\n)\s*2\.1(?:\.|\s)/m);
  if(idx<0)return paragraphs(t).length>0;
  const before=t.slice(0,idx).replace(/CAP[IÍ]TULO\s+II[^\n]*/i,"").trim();
  return words(before).length>=25;
}
function headingCaseIssues(structure){
  const lines=structure.split(/\n+/).map(x=>x.trim()).filter(Boolean),issues=[];
  lines.forEach(line=>{
    if(/^2\.\d+\.\d+\.\d+\./.test(line)){
      const text=line.replace(/^\d+(?:\.\d+)+\.?\s*/,"");
      if(text&&text===text.toUpperCase())issues.push(`El nivel de cuatro o más números aparece completamente en mayúsculas: “${line}”. Desde ese nivel usa minúsculas con mayúscula inicial.`);
    }
  });return issues;
}
$("reviewChapterBtn").addEventListener("click",()=>{
  const structure=$("chapterStructure").value.trim(),sample=$("chapterSample").value.trim(),el=$("chapterOutput");if(!structure&&!sample){show(el,"bad","<h4>🔵 FALTA INFORMACIÓN</h4><p>Pega la estructura o una muestra de redacción.</p>");return;}
  const issues=[],good=[],structureLines=structure.split(/\n+/).map(x=>x.trim()).filter(Boolean),ps=paragraphs(sample),totalWords=words(sample).length;
  if(structureLines.length>=3)good.push("La estructura contiene varios niveles para organizar el conocimiento.");else if(structure)issues.push("La estructura parece demasiado breve.");
  if(structure&&!/CAP[IÍ]TULO\s+II\.?.*MARCO\s+TE[ÓO]RICO/i.test(structure))issues.push("La estructura debe comenzar con CAPÍTULO II. MARCO TEÓRICO Y CONCEPTUAL.");
  headingCaseIssues(structure).forEach(x=>issues.push(x));
  if(sample){
    if(hasIntroBefore21(sample))good.push("Se detecta contenido introductorio antes del primer subtítulo 2.1.");else issues.push("Falta un párrafo introductorio después del título del capítulo y antes de 2.1.");
    const long=ps.filter(p=>words(p).length>145).length,bulletParas=ps.filter(p=>bulletRegex.test(p)).length,first=firstPersonRegex.test(sample),citations=(sample.match(/\([^)]*,\s*(?:19|20)\d{2}[^)]*\)/g)||[]).length+(sample.match(/\b[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ-]+\s*\((?:19|20)\d{2}\)/g)||[]).length;
    if(long===0)good.push("No se detectan párrafos excesivamente largos por el criterio aproximado de 145 palabras.");else issues.push(`${long} párrafo(s) podrían superar aproximadamente 10 líneas.`);
    if(!first)good.push("La muestra evita primera persona u opinión personal.");else issues.push("Se detecta primera persona; revisa la redacción científica.");
    if(bulletParas===0)good.push("No se detecta uso dominante de viñetas.");else issues.push("Se detectan listas; comprueba que solo enumeren características o elementos y no sustituyan la explicación científica.");
    if(citations>0)good.push(`Se detectan aproximadamente ${citations} citas autor-año.`);else issues.push("No se detectan citas autor-año. En un Marco Teórico esto merece revisión porque normalmente utiliza fuentes externas.");
  }
  show(el,issues.length?"warn":"ok",`<h4>${issues.length?"🟡 CUMPLE PARCIALMENTE":"🟢 CUMPLE FORMALMENTE"}</h4><div class="metric-grid"><div><span>Títulos/subtítulos</span><strong>${structureLines.length}</strong></div><div><span>Párrafos</span><strong>${ps.length}</strong></div><div><span>Palabras muestra</span><strong>${totalWords}</strong></div><div><span>Estado</span><strong>${issues.length?"Revisar":"Bien"}</strong></div></div><strong>Fortalezas</strong><ul class="review-list">${good.map(x=>`<li class="good">${x}</li>`).join("")}</ul>${issues.length?`<strong>Información que falta o debe mejorar</strong><ul class="review-list">${issues.map(x=>`<li class="warn">${x}</li>`).join("")}</ul>`:""}`);
});

function buildAuditPrompt(){return `ACTÚA COMO REVISOR METODOLÓGICO Y ACADÉMICO DEL CAPÍTULO II DE UN PROYECTO DE GRADO.\n\nTÍTULO DEL PROYECTO:\n${$("projectTitle").value.trim()||"[NO INDICADO]"}\n\nOBJETIVO GENERAL:\n${$("generalObjective").value.trim()||"[NO INDICADO]"}\n\nOBJETIVOS ESPECÍFICOS:\n${$("specificObjectives").value.trim()||"[NO INDICADOS]"}\n\nESTRUCTURA PROPUESTA:\n${$("chapterStructure").value.trim()||"[NO INDICADA]"}\n\nMUESTRA DE REDACCIÓN:\n${$("chapterSample").value.trim()||"[NO INGRESADA]"}\n\nREGLAS:\n1. El capítulo debe titularse CAPÍTULO II. MARCO TEÓRICO Y CONCEPTUAL.\n2. Después del título debe existir uno o dos párrafos introductorios antes del primer subtítulo 2.1.\n3. La estructura debe derivarse de sustantivos, conceptos, variables, sistemas y tecnologías presentes en los objetivos.\n4. Propón solo un ÍNDICE TENTATIVO; el estudiante puede quitar, fusionar o añadir temas.\n5. Jerarquía: capítulo en Times New Roman 16 negrilla mayúsculas; 2.1 en 14 negrilla mayúsculas; 2.1.1 en 12 negrilla mayúsculas; desde 2.1.1.1 y niveles inferiores, Times New Roman 12 negrilla en minúsculas con mayúscula inicial.\n6. El Marco Teórico contiene teorías, leyes, principios, modelos y fundamentos necesarios.\n7. El Marco Conceptual delimita conceptos clave y no debe convertirse en diccionario.\n8. No repetir Antecedentes del Capítulo I como Marco Teórico.\n9. Detecta contenidos que pertenezcan a Ingeniería del Proyecto y no al Marco Teórico.\n10. Toda definición, teoría, dato, modelo, clasificación o idea tomada de una fuente debe citarse.\n11. No inventes fuentes, autores, DOI, URL, páginas ni referencias.\n12. Señala riesgo de plagio si existe copia literal sin cita o paráfrasis demasiado cercana.\n13. Cada párrafo: máximo aproximado de 10 líneas en hoja carta, Times New Roman 12.\n14. Cada párrafo debe desarrollar: tema → idea principal → oraciones de sustento → oración final.\n15. Redacción científica, preferentemente tercera persona o forma impersonal, con conectores gramaticales.\n16. Las viñetas son excepcionales y se justifican sobre todo para enumerar características, componentes, requisitos, categorías o criterios. No deben sustituir el cuerpo narrativo.\n17. NO redactes todo el capítulo por el estudiante. Para cada falla indica qué falta, por qué importa y cómo debe mejorarlo.\n\nRESPONDE CON:\nA. DICTAMEN GENERAL.\nB. PÁRRAFO INTRODUCTORIO.\nC. COHERENCIA DEL ÍNDICE CON LOS OBJETIVOS.\nD. JERARQUÍA Y FORMATO DE TÍTULOS.\nE. MARCO TEÓRICO: temas pertinentes, sobrantes y faltantes.\nF. MARCO CONCEPTUAL: conceptos necesarios y redundantes.\nG. CONTROL DE CITAS Y RIESGO DE PLAGIO.\nH. ESTRUCTURA DE LOS PÁRRAFOS Y EXTENSIÓN.\nI. REDACCIÓN CIENTÍFICA Y CONECTORES.\nJ. USO CORRECTO/INCORRECTO DE VIÑETAS.\nK. INFORMACIÓN QUE FALTA Y CÓMO MEJORARLA.\nL. NO REESCRIBIR EL CAPÍTULO COMPLETO.`}
$("copyAuditPromptBtn").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(buildAuditPrompt());$("copyStatus").textContent="Prompt de auditoría del Capítulo II copiado."}catch(e){$("copyStatus").textContent="No se pudo copiar automáticamente."}});

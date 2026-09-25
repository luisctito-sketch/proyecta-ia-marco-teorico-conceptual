
const $ = id => document.getElementById(id);

const normalize = s => (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const words = s => (s||"").match(/\b[\p{L}\p{N}][\p{L}\p{N}-]*\b/gu)||[];
const paragraphs = s => (s||"").split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
const bulletRegex = /^\s*(?:[-•*]|\d+[.)])\s+/m;
const firstPersonRegex = /\b(yo|nosotros|nosotras|mi|mis|nuestro|nuestra|nuestros|nuestras|considero|consideramos|creo|creemos)\b/i;
const directQuoteRegex = /[“"][^”"]+[”"]/;
const apaParentheticalRegex = /\([A-ZÁÉÍÓÚÑa-záéíóúñ][^)]*,\s*(?:19|20)\d{2}(?:,\s*p{1,2}\.\s*\d+(?:-\d+)?)?\)/;
const narrativeRegex = /\b[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ-]+\s*\((?:19|20)\d{2}\)/;

function show(el, cls, html){
  el.className=`output-box ${cls}`;
  el.innerHTML=html;
  el.classList.remove("hidden");
}

function unique(arr){return [...new Set(arr.map(x=>x.trim()).filter(Boolean))]}

const preservedPhrases = [
  "internet de las cosas","inteligencia artificial","visión artificial","vision artificial",
  "control automático","control automatico","teoría de control moderno","teoria de control moderno",
  "electrónica embebida","electronica embebida","sistemas embebidos","redes de computadoras",
  "procesamiento digital de señales","comunicaciones inalámbricas","comunicaciones inalambricas",
  "variables medioambientales","variable medioambiental","consumo de energía eléctrica",
  "consumo de energia electrica","sistema electrónico","sistema electronico","sistema de control",
  "sistema de monitoreo","modelo matemático","modelo matematico","lógica difusa","logica difusa",
  "aprendizaje automático","aprendizaje automatico","energía eléctrica","energia electrica"
];

const stopWords = new Set([
  "el","la","los","las","un","una","unos","unas","de","del","al","y","e","o","u","en","para","por","con","sin","sobre","entre",
  "que","se","su","sus","este","esta","estos","estas","a","como","mediante","dentro","más","mas","menos","muy","respectivo",
  "proyecto","grado","presente","fin","forma","manera","parte","nivel","caso","ciudad","bolivia","objetivo","general","especifico","específico"
]);
const verbStems = [
  "desarroll","diseñ","disen","implement","analiz","identific","determ","evalu","valid","verific","compar","seleccion","med",
  "control","monitore","realiz","constru","integr","program","model","simul","caracteriz","propon","establec","aplic","optimiz"
];

function extractCandidates(){
  const raw=[$("generalObjective").value,$("specificObjectives").value].join(" ").trim();
  if(!raw) return [];
  const n=normalize(raw);
  const found=[];
  preservedPhrases.forEach(p=>{
    if(n.includes(normalize(p))) found.push(p);
  });

  const toks=words(raw).map(x=>normalize(x));
  toks.forEach((t,i)=>{
    if(t.length<5 || stopWords.has(t) || verbStems.some(v=>t.startsWith(v)) || /^(19|20)\d{2}$/.test(t)) return;
    if(found.some(p=>normalize(p).includes(t))) return;
    found.push(t);
  });

  return unique(found).slice(0,24);
}

$("extractTermsBtn").addEventListener("click",()=>{
  const terms=extractCandidates();
  if(!terms.length){
    alert("Escribe primero el Objetivo General y los Objetivos Específicos.");
    return;
  }
  $("candidateTerms").innerHTML=terms.map((t,i)=>
    `<label class="chip"><input type="checkbox" value="${t.replace(/"/g,"&quot;")}" ${i<10?"checked":""}> ${t}</label>`
  ).join("");
  $("candidateBox").classList.remove("hidden");
});

$("clearStructureBtn").addEventListener("click",()=>{
  $("generalObjective").value="";
  $("specificObjectives").value="";
  $("manualTerms").value="";
  $("candidateTerms").innerHTML="";
  $("candidateBox").classList.add("hidden");
  $("structureOutput").classList.add("hidden");
});

$("buildStructureBtn").addEventListener("click",()=>{
  const selected=[...document.querySelectorAll("#candidateTerms input:checked")].map(x=>x.value);
  const manual=$("manualTerms").value.split(",").map(x=>x.trim()).filter(Boolean);
  const terms=unique([...selected,...manual]).slice(0,15);
  if(!terms.length){
    alert("Selecciona o añade al menos un concepto.");
    return;
  }

  let html=`<h4>🟢 Estructura sugerida para que el estudiante la revise</h4>
    <p class="small">No es una estructura obligatoria. Elimina, agrupa o reorganiza temas según la lógica real del proyecto.</p>
    <div class="structure-tree"><div class="chapter">CAPÍTULO II. MARCO TEÓRICO Y CONCEPTUAL</div>`;

  terms.forEach((t,i)=>{
    const n=i+1;
    html+=`<div class="topic">2.${n} ${t.charAt(0).toUpperCase()+t.slice(1)}</div>
      <div class="sub">2.${n}.1 Definición y delimitación conceptual de ${t}</div>
      <div class="sub">2.${n}.2 Fundamentos, principios o modelos relacionados con ${t}</div>
      <div class="sub">2.${n}.3 Relación de ${t} con el Proyecto de Grado</div>`;
  });

  html+=`</div>
    <div class="tip-box"><strong>Revisión pedagógica:</strong> no todos los temas necesitan exactamente tres subapartados.
    Usa únicamente los que ayuden a comprender y fundamentar el proyecto. Evita incorporar temas que no aparecen en los objetivos
    ni son necesarios para ejecutar el diseño.</div>`;

  show($("structureOutput"),"ok",html);
  $("chapterStructure").value =
    "CAPÍTULO II. MARCO TEÓRICO Y CONCEPTUAL\n" +
    terms.map((t,i)=>`2.${i+1} ${t.charAt(0).toUpperCase()+t.slice(1)}`).join("\n");
});

function connectorCount(text){
  const con=["además","asimismo","de igual manera","por otra parte","sin embargo","no obstante","en consecuencia",
    "por consiguiente","es decir","en otras palabras","del mismo modo","respecto de","con relación a","referente a"];
  const n=normalize(text);
  return con.filter(c=>n.includes(normalize(c))).length;
}

$("reviewParagraphBtn").addEventListener("click",()=>{
  const text=$("paragraphText").value.trim();
  const external=$("usesExternalIdea").checked;
  const el=$("paragraphOutput");
  if(!text){ show(el,"bad","<h4>🔵 FALTA INFORMACIÓN</h4><p>Pega un párrafo completo.</p>"); return; }

  const wc=words(text).length;
  const pcs=paragraphs(text).length;
  const hasBullet=bulletRegex.test(text);
  const first=firstPersonRegex.test(text);
  const connectors=connectorCount(text);
  const hasCitation=apaParentheticalRegex.test(text)||narrativeRegex.test(text);
  const hasQuote=directQuoteRegex.test(text);
  const hasPage=/\bp{1,2}\.\s*\d+/i.test(text);

  const good=[], issues=[];
  if(pcs===1) good.push("Se detecta un solo párrafo.");
  else issues.push(`Se detectan ${pcs} bloques; revisa si realmente corresponden a un solo párrafo.`);

  if(wc<=145) good.push(`Extensión aproximada: ${wc} palabras; no se detecta una alerta evidente respecto al máximo aproximado de 10 líneas.`);
  else issues.push(`El párrafo tiene ${wc} palabras y podría superar aproximadamente 10 líneas en Times New Roman 12. Condénsalo y verifica visualmente en Word.`);

  if(!hasBullet) good.push("No se detectan viñetas dentro del párrafo.");
  else issues.push("Se detectan viñetas/listas. En el Marco Teórico debe predominar la redacción científica continua.");

  if(!first) good.push("No se detectan formas evidentes de primera persona.");
  else issues.push("Se detecta primera persona. Prefiere tercera persona o redacción impersonal cuando corresponda.");

  if(connectors>=1) good.push(`Se detectan ${connectors} conectores discursivos.`);
  else issues.push("No se detectan conectores claros. Revisa la cohesión entre la idea principal y las oraciones de sustento.");

  if(external && hasCitation) good.push("Se detecta una forma de cita autor-año.");
  if(external && !hasCitation) issues.push("Marcaste que el párrafo usa ideas externas, pero no se detecta una cita autor-año. Comprueba la fuente.");
  if(hasQuote && !hasPage) issues.push("Se detecta texto entre comillas, pero no una página en formato p./pp.; revisa si es una cita textual.");
  if(hasQuote && hasPage) good.push("La cita textual parece incluir referencia de página.");

  const cls=issues.length?"warn":"ok";
  show(el,cls,`<h4>${issues.length?"🟡 REVISAR":"🟢 CUMPLE FORMALMENTE"}</h4>
    <div class="metric-grid">
      <div><span>Palabras</span><strong>${wc}</strong></div>
      <div><span>Párrafos</span><strong>${pcs}</strong></div>
      <div><span>Conectores</span><strong>${connectors}</strong></div>
      <div><span>Cita detectada</span><strong>${hasCitation?"Sí":"No"}</strong></div>
    </div>
    <strong>Fortalezas</strong><ul class="review-list">${good.map(x=>`<li class="good">${x}</li>`).join("")}</ul>
    ${issues.length?`<strong>Qué revisar</strong><ul class="review-list">${issues.map(x=>`<li class="warn">${x}</li>`).join("")}</ul>`:""}
    <p class="small">PROYECTA-IA revisa señales formales; no puede confirmar por sí solo que una fuente sea auténtica ni que el contenido represente fielmente al autor.</p>`);
});

function similarity(a,b){
  const stop=new Set(["el","la","los","las","un","una","de","del","al","y","o","en","para","por","con","sin","que","se","su","sus","es","son","fue","como"]);
  const tok=s=>normalize(s).replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(x=>x.length>3&&!stop.has(x));
  const A=tok(a),B=tok(b), setA=new Set(A),setB=new Set(B);
  if(!setA.size||!setB.size) return 0;
  let inter=0; setA.forEach(x=>{if(setB.has(x))inter++});
  return inter/Math.min(setA.size,setB.size);
}

$("compareTextsBtn").addEventListener("click",()=>{
  const src=$("sourceOriginal").value.trim();
  const stu=$("studentVersion").value.trim();
  const author=$("sourceAuthor").value.trim();
  const year=$("sourceYear").value.trim();
  const page=$("sourcePage").value.trim();
  const el=$("comparisonOutput");
  if(!src||!stu){ show(el,"bad","<h4>🔵 FALTA INFORMACIÓN</h4><p>Pega el fragmento original y la versión del estudiante.</p>"); return; }

  const sim=similarity(src,stu);
  const pct=Math.round(sim*100);
  const citationDetected=apaParentheticalRegex.test(stu)||narrativeRegex.test(stu);
  const quote=directQuoteRegex.test(stu);
  const issues=[], good=[];

  if(sim>=0.70 && !quote) issues.push(`Coincidencia léxica muy alta (${pct}%). La paráfrasis parece demasiado cercana al original. Reestructura la idea completamente, no solo sustituyas palabras.`);
  else if(sim>=0.50 && !quote) issues.push(`Coincidencia léxica moderada-alta (${pct}%). Revisa si la paráfrasis conserva demasiada estructura del original.`);
  else good.push(`Coincidencia léxica aproximada: ${pct}%. No se detecta por sí sola una similitud extrema.`);

  if(citationDetected) good.push("Se detecta una cita autor-año en la versión del estudiante.");
  else issues.push("No se detecta cita autor-año. Si la idea procede de esta fuente, debe reconocerse aunque esté parafraseada.");

  if(quote && !page) issues.push("Parece existir cita textual, pero no proporcionaste página.");
  if(!author||!/^\d{4}$/.test(year)) issues.push("Completa autor y año reales para poder documentar correctamente la fuente.");

  show(el,issues.length?"warn":"ok",`<h4>${issues.length?"🟡 ORIENTACIÓN DE INTEGRIDAD":"🟢 REVISIÓN FORMAL FAVORABLE"}</h4>
    <p><strong>Coincidencia aproximada:</strong> ${pct}%</p>
    ${good.length?`<ul class="review-list">${good.map(x=>`<li class="good">${x}</li>`).join("")}</ul>`:""}
    ${issues.length?`<ul class="review-list">${issues.map(x=>`<li class="warn">${x}</li>`).join("")}</ul>`:""}
    <p class="small"><strong>No es un detector de plagio.</strong> Este cálculo solo sirve como alerta pedagógica al comparar los dos textos proporcionados.</p>`);
});

$("reviewChapterBtn").addEventListener("click",()=>{
  const structure=$("chapterStructure").value.trim();
  const sample=$("chapterSample").value.trim();
  const el=$("chapterOutput");
  if(!structure&&!sample){ show(el,"bad","<h4>🔵 FALTA INFORMACIÓN</h4><p>Pega la estructura o una muestra de redacción.</p>"); return; }

  const issues=[],good=[];
  const structureLines=structure.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const ps=paragraphs(sample);
  const totalWords=words(sample).length;

  if(structureLines.length>=3) good.push("La estructura contiene varios temas/subtemas para organizar el conocimiento.");
  else if(structure) issues.push("La estructura parece demasiado breve. Comprueba si cubre los conceptos y fundamentos derivados de los objetivos.");

  if(sample){
    const long=ps.filter(p=>words(p).length>145).length;
    const bulletParas=ps.filter(p=>bulletRegex.test(p)).length;
    const first=firstPersonRegex.test(sample);
    const citations=(sample.match(/\([^)]*,\s*(?:19|20)\d{2}[^)]*\)/g)||[]).length +
                    (sample.match(/\b[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ-]+\s*\((?:19|20)\d{2}\)/g)||[]).length;
    if(long===0) good.push("No se detectan párrafos excesivamente largos por el criterio aproximado de 145 palabras.");
    else issues.push(`${long} párrafo(s) podrían superar aproximadamente 10 líneas.`);
    if(!first) good.push("La muestra evita formas evidentes de primera persona.");
    else issues.push("Se detecta primera persona; revisa la redacción científica.");
    if(bulletParas===0) good.push("No se detecta uso dominante de viñetas en los párrafos.");
    else issues.push("Se detecta uso de listas/viñetas; verifica que no sustituyan la explicación científica.");
    if(citations>0) good.push(`Se detectan aproximadamente ${citations} citas autor-año.`);
    else issues.push("No se detectan citas autor-año en la muestra. En un Marco Teórico esto merece revisión, porque normalmente utiliza conocimiento de fuentes externas.");
  }

  show(el,issues.length?"warn":"ok",`<h4>${issues.length?"🟡 CUMPLE PARCIALMENTE":"🟢 CUMPLE FORMALMENTE"}</h4>
    <div class="metric-grid">
      <div><span>Títulos/subtítulos</span><strong>${structureLines.length}</strong></div>
      <div><span>Párrafos</span><strong>${ps.length}</strong></div>
      <div><span>Palabras muestra</span><strong>${totalWords}</strong></div>
      <div><span>Estado</span><strong>${issues.length?"Revisar":"Bien"}</strong></div>
    </div>
    <strong>Fortalezas</strong><ul class="review-list">${good.map(x=>`<li class="good">${x}</li>`).join("")}</ul>
    ${issues.length?`<strong>Información que falta o debe mejorar</strong><ul class="review-list">${issues.map(x=>`<li class="warn">${x}</li>`).join("")}</ul>`:""}
  `);
});

function buildAuditPrompt(){
  return `ACTÚA COMO REVISOR METODOLÓGICO Y ACADÉMICO DEL CAPÍTULO II DE UN PROYECTO DE GRADO.

CAPÍTULO II: MARCO TEÓRICO Y CONCEPTUAL

OBJETIVO GENERAL:
${$("generalObjective").value.trim()||"[NO INDICADO]"}

OBJETIVOS ESPECÍFICOS:
${$("specificObjectives").value.trim()||"[NO INDICADOS]"}

ESTRUCTURA PROPUESTA:
${$("chapterStructure").value.trim()||"[NO INDICADA]"}

MUESTRA DE REDACCIÓN:
${$("chapterSample").value.trim()||"[NO INGRESADA]"}

REGLAS:
1. El Marco Teórico debe contener teorías, leyes, principios, modelos, fundamentos científicos y tecnológicos necesarios para sustentar el proyecto.
2. El Marco Conceptual debe delimitar los conceptos clave utilizados en el proyecto; no debe convertirse en un diccionario indiscriminado.
3. La estructura debe surgir de los conceptos, sustantivos, variables, sistemas y tecnologías presentes en el Objetivo General y los Objetivos Específicos.
4. No inventes temas que no tengan relación con los objetivos.
5. No repetir los Antecedentes del Capítulo I como si fueran Marco Teórico.
6. Detecta posibles contenidos que pertenezcan al Capítulo III (diseño propio del proyecto) y no al Marco Teórico.
7. Toda definición, teoría, dato, modelo, clasificación o idea tomada de una fuente debe citarse.
8. No inventes fuentes, autores, DOI, URL, páginas ni referencias.
9. Diferencia cita textual de paráfrasis y aplica APA 6.
10. Señala riesgo de plagio cuando exista copia literal sin cita o paráfrasis demasiado cercana.
11. Cada párrafo debe mantenerse aproximadamente dentro de 10 líneas en hoja carta, Times New Roman 12; si parece extenso, indícalo.
12. Redacción científica, preferentemente tercera persona o forma impersonal, utilizando conectores gramaticales.
13. Las viñetas son excepcionales: solo para enumeraciones reales como componentes, requisitos, categorías, características, etapas o criterios. No deben sustituir la exposición científica.
14. NO redactes todo el Capítulo II por el estudiante.
15. Para cada falla indica qué falta, por qué importa y cómo debe mejorarlo el estudiante.

RESPONDE CON:
A. DICTAMEN GENERAL.
B. COHERENCIA DE LA ESTRUCTURA CON LOS OBJETIVOS.
C. MARCO TEÓRICO: qué temas corresponden, sobran o faltan.
D. MARCO CONCEPTUAL: conceptos necesarios y redundantes.
E. CONTROL DE CITAS Y RIESGO DE PLAGIO.
F. REDACCIÓN CIENTÍFICA Y CONECTORES.
G. EXTENSIÓN DE PÁRRAFOS.
H. USO CORRECTO/INCORRECTO DE VIÑETAS.
I. INFORMACIÓN QUE FALTA Y CÓMO MEJORARLA.
J. NO REESCRIBIR EL CAPÍTULO COMPLETO.`;
}

$("copyAuditPromptBtn").addEventListener("click",async()=>{
  try{
    await navigator.clipboard.writeText(buildAuditPrompt());
    $("copyStatus").textContent="Prompt de auditoría del Capítulo II copiado.";
  }catch(e){
    $("copyStatus").textContent="No se pudo copiar automáticamente.";
  }
});

// ════════════════════════════════════════════════════════════════
// CONSTANTES ANATÔMICAS — Imagens H/M, mãos, pés + regiões.
// Refactor v296: extraído do App.jsx pra arquivo próprio.
// PURE DATA — zero dependência de React/DOM. Importável de qualquer lugar.
// ════════════════════════════════════════════════════════════════

// ── IMAGENS DO CORPO — H (homem) / M (mulher) ──
// Mãos e pés são compartilhados (sem distinção de sexo).
// IMG_H/IMG_M: dicionários selecionados via sx ("Feminino" → M, senão H).
export const IMG_H = {
  anterior: "/img/anatomy/h-anterior.jpg",
  posterior: "/img/anatomy/h-posterior.jpg",
  latD: "/img/anatomy/h-lat-d.jpg",
  latE: "/img/anatomy/h-lat-e.jpg",
  cabeca: "/img/anatomy/h-cabeca.jpg",
};
export const IMG_M = {
  anterior: "/img/anatomy/m-anterior.png",
  posterior: "/img/anatomy/m-posterior.png",
  latD: "/img/anatomy/m-lat-d.png",
  latE: "/img/anatomy/m-lat-e.png",
  cabeca: "/img/anatomy/m-cabeca.jpg",
};
export const IMG_MAO_D = "/img/anatomy/mao-d.png";
export const IMG_MAO_E = "/img/anatomy/mao-e.png";
export const IMG_PE_D = "/img/anatomy/pe-d.jpg";
export const IMG_PE_E = "/img/anatomy/pe-e.jpg";
export const bodyImgs = (sx) => sx === "Feminino" ? IMG_M : IMG_H;

// ── TIPOS DE FERIDA/LESÃO ──
export const WT = ["1. Orifício entrada (PAF)","2. Orifício saída (PAF)","3. Escoriação","4. Equimose","5. Hematoma","6. Fratura","7. Contusa","8. Incisa","9. Punctória","10. Cortocontusa","11. Perfuroincisa","12. Jellineck","13. Sulco","14. Laceração","15. Tatuagem","16. Petéquia","17. Aderência de sujidades","18. Manchas de sangue","19. Outro"];

// ── REGIÕES ANATÔMICAS ──
// RF: regiões frontais (corpo de frente)
// RB: regiões posteriores (costas)
// RH: regiões da cabeça
// RMD/RME: mão direita / esquerda
// RPD/RPE: pé direito / esquerdo
// AR: agregado de tudo (lookup global pra label)

export const RF = [{id:"f_cerv_ant",l:"Pescoço frente (Cervical anterior)"},{id:"f_esternal",l:"Centro do peito (Esternal)"},{id:"f_torac_d",l:"Peito direito (Torácica D)"},{id:"f_torac_e",l:"Peito esquerdo (Torácica E)"},{id:"f_epigast",l:"Boca do estômago (Epigástrica)"},{id:"f_hipoc_d",l:"Costelas baixas D (Hipocôndrio D)"},{id:"f_hipoc_e",l:"Costelas baixas E (Hipocôndrio E)"},{id:"f_mesogast",l:"Meio do abdômen (Mesogástrica)"},{id:"f_hipogast",l:"Baixo ventre (Hipogástrica)"},{id:"f_flanco_d",l:"Lateral barriga D (Flanco D)"},{id:"f_flanco_e",l:"Lateral barriga E (Flanco E)"},{id:"f_pubiana",l:"Acima do púbis (Púbica)"},{id:"f_genital",l:"Região genital (Genital)"},{id:"f_supraclav_d",l:"Acima da clavícula D (Supraclavicular D)"},{id:"f_supraclav_e",l:"Acima da clavícula E (Supraclavicular E)"},{id:"f_braco_d",l:"Braço D (frente)"},{id:"f_braco_e",l:"Braço E (frente)"},{id:"f_cubital_d",l:"Dobra do cotovelo D (Cubital D)"},{id:"f_cubital_e",l:"Dobra do cotovelo E (Cubital E)"},{id:"f_antebr_d",l:"Antebraço D (frente)"},{id:"f_antebr_e",l:"Antebraço E (frente)"},{id:"f_coxa_d",l:"Coxa D (frente)"},{id:"f_coxa_e",l:"Coxa E (frente)"},{id:"f_joelho_d",l:"Joelho D (frente)"},{id:"f_joelho_e",l:"Joelho E (frente)"},{id:"f_perna_d",l:"Canela D (Perna anterior D)"},{id:"f_perna_e",l:"Canela E (Perna anterior E)"}];

export const RB = [{id:"b_cerv_post",l:"Pescoço atrás (Cervical posterior)"},{id:"b_escapular_d",l:"Omoplata D (Escapular D)"},{id:"b_escapular_e",l:"Omoplata E (Escapular E)"},{id:"b_dorsal",l:"Costas alta (Dorsal)"},{id:"b_lombar_d",l:"Cintura D (Lombar D)"},{id:"b_lombar_e",l:"Cintura E (Lombar E)"},{id:"b_sacro_d",l:"Acima da nádega D (Sacral D)"},{id:"b_sacro_e",l:"Acima da nádega E (Sacral E)"},{id:"b_glutea_d",l:"Nádega D (Glútea D)"},{id:"b_glutea_e",l:"Nádega E (Glútea E)"},{id:"b_coxa_d",l:"Coxa atrás D (Posterior D)"},{id:"b_coxa_e",l:"Coxa atrás E (Posterior E)"},{id:"b_perna_d",l:"Panturrilha D (Gemelar D)"},{id:"b_perna_e",l:"Panturrilha E (Gemelar E)"},{id:"b_deltoid_d",l:"Ombro D (Deltoidiana D)"},{id:"b_deltoid_e",l:"Ombro E (Deltoidiana E)"},{id:"b_braco_d",l:"Braço atrás D (Posterior D)"},{id:"b_braco_e",l:"Braço atrás E (Posterior E)"},{id:"b_antebr_d",l:"Antebraço atrás D (Posterior D)"},{id:"b_antebr_e",l:"Antebraço atrás E (Posterior E)"}];

export const RH = [{id:"h_frontal",l:"Testa (Frontal)"},{id:"h_parietal_d",l:"Lateral cabeça D (Parietal D)"},{id:"h_parietal_e",l:"Lateral cabeça E (Parietal E)"},{id:"h_temporal_d",l:"Têmpora D (Temporal D)"},{id:"h_temporal_e",l:"Têmpora E (Temporal E)"},{id:"h_occipital",l:"Nuca (Occipital)"},{id:"h_vertex",l:"Topo da cabeça (Vértex)"},{id:"h_orbit_d",l:"Olho D (Orbitária D)"},{id:"h_orbit_e",l:"Olho E (Orbitária E)"},{id:"h_nasal",l:"Nariz (Nasal)"},{id:"h_labial_sup",l:"Lábio superior (Labial superior)"},{id:"h_labial_inf",l:"Lábio inferior (Labial inferior)"},{id:"h_mentoniana",l:"Queixo (Mentoniana)"},{id:"h_auricular_d",l:"Orelha D (Auricular D)"},{id:"h_auricular_e",l:"Orelha E (Auricular E)"}];

// v292: dedos com IDs separados para palma/dorso. IDs antigos (md_polegar
// genérico) ficam mantidos pra compat com backups antigos.
export const RMD = [{id:"md_palma",l:"Palma da mão D (Palmar D)"},{id:"md_dorso",l:"Dorso da mão D (Dorsal D)"},{id:"md_polegar_palma",l:"Polegar D — palma (1º quirodáctilo D, palmar)"},{id:"md_polegar_dorso",l:"Polegar D — dorso (1º quirodáctilo D, dorsal)"},{id:"md_indicador_palma",l:"Indicador D — palma (2º quirodáctilo D, palmar)"},{id:"md_indicador_dorso",l:"Indicador D — dorso (2º quirodáctilo D, dorsal)"},{id:"md_medio_palma",l:"Dedo médio D — palma (3º quirodáctilo D, palmar)"},{id:"md_medio_dorso",l:"Dedo médio D — dorso (3º quirodáctilo D, dorsal)"},{id:"md_anelar_palma",l:"Anelar D — palma (4º quirodáctilo D, palmar)"},{id:"md_anelar_dorso",l:"Anelar D — dorso (4º quirodáctilo D, dorsal)"},{id:"md_minimo_palma",l:"Mindinho D — palma (5º quirodáctilo D, palmar)"},{id:"md_minimo_dorso",l:"Mindinho D — dorso (5º quirodáctilo D, dorsal)"},{id:"md_punho",l:"Punho D (Carpo D)"},{id:"md_polegar",l:"Polegar D (1º quirodáctilo D)"},{id:"md_indicador",l:"Indicador D (2º quirodáctilo D)"},{id:"md_medio",l:"Dedo médio D (3º quirodáctilo D)"},{id:"md_anelar",l:"Anelar D (4º quirodáctilo D)"},{id:"md_minimo",l:"Mindinho D (5º quirodáctilo D / Mínimo D)"}];

export const RME = [{id:"me_palma",l:"Palma da mão E (Palmar E)"},{id:"me_dorso",l:"Dorso da mão E (Dorsal E)"},{id:"me_polegar_palma",l:"Polegar E — palma (1º quirodáctilo E, palmar)"},{id:"me_polegar_dorso",l:"Polegar E — dorso (1º quirodáctilo E, dorsal)"},{id:"me_indicador_palma",l:"Indicador E — palma (2º quirodáctilo E, palmar)"},{id:"me_indicador_dorso",l:"Indicador E — dorso (2º quirodáctilo E, dorsal)"},{id:"me_medio_palma",l:"Dedo médio E — palma (3º quirodáctilo E, palmar)"},{id:"me_medio_dorso",l:"Dedo médio E — dorso (3º quirodáctilo E, dorsal)"},{id:"me_anelar_palma",l:"Anelar E — palma (4º quirodáctilo E, palmar)"},{id:"me_anelar_dorso",l:"Anelar E — dorso (4º quirodáctilo E, dorsal)"},{id:"me_minimo_palma",l:"Mindinho E — palma (5º quirodáctilo E, palmar)"},{id:"me_minimo_dorso",l:"Mindinho E — dorso (5º quirodáctilo E, dorsal)"},{id:"me_punho",l:"Punho E (Carpo E)"},{id:"me_polegar",l:"Polegar E (1º quirodáctilo E)"},{id:"me_indicador",l:"Indicador E (2º quirodáctilo E)"},{id:"me_medio",l:"Dedo médio E (3º quirodáctilo E)"},{id:"me_anelar",l:"Anelar E (4º quirodáctilo E)"},{id:"me_minimo",l:"Mindinho E (5º quirodáctilo E / Mínimo E)"}];

export const RPD = [{id:"pd_planta",l:"Planta do pé D (Plantar D)"},{id:"pd_dorso",l:"Peito do pé D (Dorsal D)"},{id:"pd_calcanhar",l:"Calcanhar D — peito (Calcâneo D, Dorsal)"},{id:"pd_dedao",l:"Dedão D — peito (Hálux D, Dorsal)"},{id:"pd_2dedo",l:"2º dedo D — peito (2º pododáctilo D)"},{id:"pd_3dedo",l:"3º dedo D — peito (3º pododáctilo D)"},{id:"pd_4dedo",l:"4º dedo D — peito (4º pododáctilo D)"},{id:"pd_mindinho",l:"Mindinho D — peito (5º pododáctilo D)"},{id:"pd_tornoz",l:"Tornozelo D — peito (Tarso D, Dorsal)"},{id:"pd_pl_calcanhar",l:"Calcanhar D — sola (Calcâneo D, Plantar)"},{id:"pd_pl_dedao",l:"Dedão D — sola (Hálux D, Plantar)"},{id:"pd_pl_2dedo",l:"2º dedo D — sola (2º pododáctilo D, Plantar)"},{id:"pd_pl_3dedo",l:"3º dedo D — sola (3º pododáctilo D, Plantar)"},{id:"pd_pl_4dedo",l:"4º dedo D — sola (4º pododáctilo D, Plantar)"},{id:"pd_pl_mindinho",l:"Mindinho D — sola (5º pododáctilo D, Plantar)"},{id:"pd_pl_tornoz",l:"Tornozelo D — sola (Tarso D, Plantar)"}];

export const RPE = [{id:"pe_planta",l:"Planta do pé E (Plantar E)"},{id:"pe_dorso",l:"Peito do pé E (Dorsal E)"},{id:"pe_calcanhar",l:"Calcanhar E — peito (Calcâneo E, Dorsal)"},{id:"pe_dedao",l:"Dedão E — peito (Hálux E, Dorsal)"},{id:"pe_2dedo",l:"2º dedo E — peito (2º pododáctilo E)"},{id:"pe_3dedo",l:"3º dedo E — peito (3º pododáctilo E)"},{id:"pe_4dedo",l:"4º dedo E — peito (4º pododáctilo E)"},{id:"pe_mindinho",l:"Mindinho E — peito (5º pododáctilo E)"},{id:"pe_tornoz",l:"Tornozelo E — peito (Tarso E, Dorsal)"},{id:"pe_pl_calcanhar",l:"Calcanhar E — sola (Calcâneo E, Plantar)"},{id:"pe_pl_dedao",l:"Dedão E — sola (Hálux E, Plantar)"},{id:"pe_pl_2dedo",l:"2º dedo E — sola (2º pododáctilo E, Plantar)"},{id:"pe_pl_3dedo",l:"3º dedo E — sola (3º pododáctilo E, Plantar)"},{id:"pe_pl_4dedo",l:"4º dedo E — sola (4º pododáctilo E, Plantar)"},{id:"pe_pl_mindinho",l:"Mindinho E — sola (5º pododáctilo E, Plantar)"},{id:"pe_pl_tornoz",l:"Tornozelo E — sola (Tarso E, Plantar)"}];

// Agregado de TODAS as regiões anatômicas (para lookup global por id).
export const AR = [...RF, ...RB, ...RH, ...RMD, ...RME, ...RPD, ...RPE];

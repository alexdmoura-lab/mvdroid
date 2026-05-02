// ════════════════════════════════════════════════════════════════
// CONSTANTES DE VEÍCULOS — Imagens, regiões clicáveis, posições no croqui.
// Refactor v296: extraído do App.jsx pra arquivo próprio.
// PURE DATA — zero dependência de React/DOM.
// ════════════════════════════════════════════════════════════════

// ── IMAGENS DOS VEÍCULOS ──
// Sedan/Hatch/SUV compartilham o interior (interior-superior/d/e).
export const IMG_VEI = {
  sedan: { ant: "/img/vehicles/sedan-anterior.png", pos: "/img/vehicles/sedan-posterior.png", latD: "/img/vehicles/sedan-lat-d.png", latE: "/img/vehicles/sedan-lat-e.png", sup: "/img/vehicles/sedan-superior.png" },
  hatch: { ant: "/img/vehicles/hatch-anterior.jpg", pos: "/img/vehicles/hatch-posterior.jpg", latD: "/img/vehicles/hatch-lat-d.jpg", latE: "/img/vehicles/hatch-lat-e.jpg", sup: "/img/vehicles/hatch-superior.jpg" },
  suv: { ant: "/img/vehicles/suv-anterior.png", pos: "/img/vehicles/suv-posterior.png", latD: "/img/vehicles/suv-lat-d.png", latE: "/img/vehicles/suv-lat-e.png", sup: "/img/vehicles/suv-superior.png" },
  caminhonete: { ant: "/img/vehicles/caminhonete-anterior.jpg", pos: "/img/vehicles/caminhonete-posterior.jpg", latD: "/img/vehicles/caminhonete-lat-d.jpg", latE: "/img/vehicles/caminhonete-lat-e.jpg", sup: "/img/vehicles/caminhonete-superior.jpg" },
  interior: { sup: "/img/vehicles/interior-superior.png", d: "/img/vehicles/interior-d.png", e: "/img/vehicles/interior-e.png" },
  onibus: { latD: "/img/vehicles/onibus-lat-d.png", latE: "/img/vehicles/onibus-lat-e.png", frenteTras: "/img/vehicles/onibus-frente-tras.png", interior: "/img/vehicles/onibus-interior.png" },
  moto: { laterais: "/img/vehicles/moto-laterais.png", frenteTras: "/img/vehicles/moto-frente-tras.jpg", sup: "/img/vehicles/moto-superior.jpg" },
  bici: { lateral: "/img/vehicles/bici-lateral.jpg", frenteTras: "/img/vehicles/bici-frente-tras.jpg", sup: "/img/vehicles/bici-superior.jpg" },
};

// Tipos com vistas mapeadas no Croqui visual.
export const VEI_TIPOS_COM_SVG = ["sedan","hatch","suv","caminhonete","moto","bicicleta","onibus","ônibus"];

// Campos do veículo persistidos em data["v"+vi+"_"+f] — usados por hasVehicleData.
export const VEHICLE_FIELDS = ["cat","tipo","cor","placa","ano","chassi","km","estado","motor","portas","vidros","chave","obs"];

// ── REGIÕES DOS VEÍCULOS (carro/SUV/caminhonete) ──
// v291: vidros das portas marcados como "Face externa do vidro..." pra deixar
// claro que é diferente da face interna (que é tagueada via vi_vidro_int_*).
export const RVE = [{id:"ve_porta_ant_e",l:"Face externa da porta anterior esquerda"},{id:"ve_porta_pos_e",l:"Face externa da porta posterior esquerda"},{id:"ve_vidro_ant_e",l:"Face externa do vidro anterior esquerdo"},{id:"ve_vidro_pos_e",l:"Face externa do vidro posterior esquerdo"},{id:"ve_retrovisor_e",l:"Retrovisor esquerdo"},{id:"ve_paralama_ant_e",l:"Para-lama anterior esquerdo"},{id:"ve_paralama_pos_e",l:"Para-lama posterior esquerdo"},{id:"ve_parachoque_ant_e",l:"Para-choque anterior esquerdo"},{id:"ve_parachoque_pos_e",l:"Para-choque posterior esquerdo"},{id:"ve_roda_ant_e",l:"Roda anterior esquerda"},{id:"ve_roda_pos_e",l:"Roda posterior esquerda"},{id:"ve_pneu_ant_e",l:"Pneu anterior esquerdo"},{id:"ve_pneu_pos_e",l:"Pneu posterior esquerdo"},{id:"ve_soleira_e",l:"Soleira esquerda"},{id:"ve_coluna_a_e",l:"Coluna A esquerda"},{id:"ve_coluna_b_e",l:"Coluna B esquerda"},{id:"ve_coluna_c_e",l:"Coluna C esquerda"}];

export const RVD = [{id:"ve_porta_ant_d",l:"Face externa da porta anterior direita"},{id:"ve_porta_pos_d",l:"Face externa da porta posterior direita"},{id:"ve_vidro_ant_d",l:"Face externa do vidro anterior direito"},{id:"ve_vidro_pos_d",l:"Face externa do vidro posterior direito"},{id:"ve_retrovisor_d",l:"Retrovisor direito"},{id:"ve_paralama_ant_d",l:"Para-lama anterior direito"},{id:"ve_paralama_pos_d",l:"Para-lama posterior direito"},{id:"ve_parachoque_ant_d",l:"Para-choque anterior direito"},{id:"ve_parachoque_pos_d",l:"Para-choque posterior direito"},{id:"ve_roda_ant_d",l:"Roda anterior direita"},{id:"ve_roda_pos_d",l:"Roda posterior direita"},{id:"ve_pneu_ant_d",l:"Pneu anterior direito"},{id:"ve_pneu_pos_d",l:"Pneu posterior direito"},{id:"ve_soleira_d",l:"Soleira direita"},{id:"ve_coluna_a_d",l:"Coluna A direita"},{id:"ve_coluna_b_d",l:"Coluna B direita"},{id:"ve_coluna_c_d",l:"Coluna C direita"}];

export const RVF = [{id:"ve_capo",l:"Capô"},{id:"ve_parabrisa",l:"Para-brisa dianteiro"},{id:"ve_farol_e",l:"Farol dianteiro esquerdo"},{id:"ve_farol_d",l:"Farol dianteiro direito"},{id:"ve_grade",l:"Grade frontal"},{id:"ve_parachoque_d_e",l:"Para-choque dianteiro esquerdo"},{id:"ve_parachoque_d_c",l:"Para-choque dianteiro central"},{id:"ve_parachoque_d_d",l:"Para-choque dianteiro direito"},{id:"ve_placa_d",l:"Placa dianteira"}];

export const RVT = [{id:"ve_portamalas",l:"Tampa do porta-malas"},{id:"ve_vidro_tras",l:"Vidro traseiro"},{id:"ve_lanterna_e",l:"Lanterna traseira esquerda"},{id:"ve_lanterna_d",l:"Lanterna traseira direita"},{id:"ve_parachoque_t_e",l:"Para-choque traseiro esquerdo"},{id:"ve_parachoque_t_c",l:"Para-choque traseiro central"},{id:"ve_parachoque_t_d",l:"Para-choque traseiro direito"},{id:"ve_placa_t",l:"Placa traseira"}];

export const RVTe = [{id:"ve_teto_ant_e",l:"Teto anterior esquerdo"},{id:"ve_teto_ant_d",l:"Teto anterior direito"},{id:"ve_teto_pos_e",l:"Teto posterior esquerdo"},{id:"ve_teto_pos_d",l:"Teto posterior direito"}];

// v291: faces internas dos vidros (vi_vidro_int_*) adicionadas — pareando
// com vi_porta_int_* (já existentes).
export const RVI = [{id:"vi_volante",l:"Volante"},{id:"vi_painel",l:"Painel de instrumentos"},{id:"vi_cambio",l:"Alavanca de câmbio"},{id:"vi_freio_estac",l:"Freio de estacionamento"},{id:"vi_banco_mot",l:"Banco do motorista"},{id:"vi_banco_pass",l:"Banco do passageiro"},{id:"vi_banco_tras_e",l:"Banco traseiro esquerdo"},{id:"vi_banco_tras_d",l:"Banco traseiro direito"},{id:"vi_banco_tras_c",l:"Banco traseiro central"},{id:"vi_assoalho_ant",l:"Assoalho dianteiro"},{id:"vi_assoalho_pos",l:"Assoalho traseiro"},{id:"vi_forro_teto",l:"Forro do teto"},{id:"vi_porta_int_ant_e",l:"Face interna da porta anterior esquerda"},{id:"vi_porta_int_ant_d",l:"Face interna da porta anterior direita"},{id:"vi_porta_int_pos_e",l:"Face interna da porta posterior esquerda"},{id:"vi_porta_int_pos_d",l:"Face interna da porta posterior direita"},{id:"vi_vidro_int_ant_e",l:"Face interna do vidro anterior esquerdo"},{id:"vi_vidro_int_ant_d",l:"Face interna do vidro anterior direito"},{id:"vi_vidro_int_pos_e",l:"Face interna do vidro posterior esquerdo"},{id:"vi_vidro_int_pos_d",l:"Face interna do vidro posterior direito"},{id:"vi_vidro_int_parabrisa",l:"Face interna do para-brisa"},{id:"vi_vidro_int_tras",l:"Face interna do vidro traseiro"},{id:"vi_portamalas_int",l:"Interior do porta-malas"},{id:"vi_console",l:"Console central"},{id:"vi_porta_luvas",l:"Porta-luvas"},{id:"vi_retrovisor_int",l:"Retrovisor interno"}];

// Agregado de TODAS as regiões veiculares (lookup global).
export const AV = [...RVE, ...RVD, ...RVF, ...RVT, ...RVTe, ...RVI];

// ── TIPOS DE VESTÍGIO VEICULAR (selector da aba Veículo) ──
export const VVT = ["Amassamentos","Ausência de partes / peças","Avarias produzidas por ação do calor","Elementos balísticos","Indícios de presença de fluido(s) biológico(s) no interior do veículo","Mancha(s) de sangue de alta velocidade","Mancha(s) de sangue de média velocidade","Mancha(s) de sangue formada(s) por arrastamento","Mancha(s) de sangue formada(s) por contato","Mancha(s) de sangue formada(s) por gotejamento","Manchas de sangue","Marca(s) de alimpadura","Marca(s) de impacto produzida(s) por objeto(s) em ação contundente","Marca(s) de impacto tipicamente produzida(s) por projétil(eis) de arma de fogo","Marcas de fricção","Não foram encontrados elementos de interesse pericial","Perfuração(ões) tipicamente produzida(s) por projétil(eis) de arma de fogo","Presença de manchas latentes reveladas com o uso de luminol","Presença de sangue humano","Quebramentos","Veste(s) com orifício(s) típico(s) daquele(s) produzido(s) por passagem de projétil expelido por arma de fogo","Vestes com sangue","Outro"];

// ── POSIÇÕES DOS MARCADORES DO CROQUI VISUAL ──
// Cada chave é o id da região; valor é [x, y] em pixels do viewBox da imagem.
// Usados pelo mkVeiViews pra desenhar bolinhas vermelhas numeradas.

// Carro (sedan/hatch/suv/caminhonete) — viewBox 800x400 (laterais), 800x440 (frente/traseira/sup), 800x440 (interior).
export const POS_VEI_LAT_E = {"ve_vidro_ant_e":[270,115],"ve_vidro_pos_e":[450,115],"ve_porta_ant_e":[275,195],"ve_porta_pos_e":[455,195],"ve_coluna_a_e":[198,115],"ve_coluna_b_e":[355,115],"ve_coluna_c_e":[590,115],"ve_retrovisor_e":[65,165],"ve_paralama_ant_e":[150,225],"ve_paralama_pos_e":[650,225],"ve_parachoque_ant_e":[45,265],"ve_parachoque_pos_e":[755,265],"ve_soleira_e":[400,268],"ve_roda_ant_e":[150,300],"ve_roda_pos_e":[650,300],"ve_pneu_ant_e":[150,345],"ve_pneu_pos_e":[650,345]};
export const POS_VEI_LAT_D = {"ve_vidro_ant_d":[510,115],"ve_vidro_pos_d":[330,115],"ve_porta_ant_d":[515,195],"ve_porta_pos_d":[335,195],"ve_coluna_a_d":[600,115],"ve_coluna_b_d":[455,115],"ve_coluna_c_d":[210,115],"ve_retrovisor_d":[735,165],"ve_paralama_ant_d":[650,225],"ve_paralama_pos_d":[150,225],"ve_parachoque_ant_d":[755,265],"ve_parachoque_pos_d":[45,265],"ve_soleira_d":[400,268],"ve_roda_ant_d":[650,300],"ve_roda_pos_d":[150,300],"ve_pneu_ant_d":[650,345],"ve_pneu_pos_d":[150,345]};
export const POS_VEI_FRENTE = {"ve_parabrisa":[400,105],"ve_capo":[400,205],"ve_farol_e":[205,275],"ve_farol_d":[595,275],"ve_grade":[400,275],"ve_parachoque_d_e":[215,330],"ve_parachoque_d_d":[585,330],"ve_placa_d":[400,324],"ve_parachoque_d_c":[400,356]};
export const POS_VEI_TRAS = {"ve_vidro_tras":[400,110],"ve_portamalas":[400,215],"ve_lanterna_e":[200,235],"ve_lanterna_d":[600,235],"ve_placa_t":[400,259],"ve_parachoque_t_e":[215,330],"ve_parachoque_t_d":[585,330],"ve_parachoque_t_c":[400,330]};
export const POS_VEI_SUP = {"ve_capo_d":[700,140],"ve_capo_e":[700,280],"ve_teto_ant_d":[530,140],"ve_teto_ant_e":[530,280],"ve_teto_pos_d":[340,140],"ve_teto_pos_e":[340,280],"ve_portamalas_d":[140,140],"ve_portamalas_e":[140,280]};
export const POS_VEI_INT_SUP = {"vi_volante":[640,210],"vi_painel":[680,95],"vi_banco_mot":[495,205],"vi_banco_pass":[495,375],"vi_console":[425,260],"vi_banco_tras_e":[190,375],"vi_banco_tras_c":[310,375],"vi_banco_tras_d":[250,205],"vi_assoalho_ant":[410,250],"vi_assoalho_pos":[90,250]};
// v291: posições das faces internas D/E adicionadas — vi_porta_int_*_d e vi_vidro_int_*_d
export const POS_VEI_INT_D = {"vi_banco_tras_e":[85,200],"vi_banco_tras_d":[215,200],"vi_banco_mot":[355,240],"vi_banco_pass":[480,245],"vi_apoio_cab_mot":[335,120],"vi_parabrisa_int":[450,55],"vi_retrovisor_int":[535,75],"vi_volante":[685,195],"vi_painel":[660,115],"vi_porta_luvas":[735,285],"vi_console":[600,295],"vi_cinto_seg":[410,205],"vi_assoalho_pos":[145,385],"vi_assoalho_ant":[500,385],"vi_forro_teto":[245,45],"vi_porta_int_ant_d":[600,360],"vi_porta_int_pos_d":[120,360],"vi_vidro_int_ant_d":[660,15],"vi_vidro_int_pos_d":[120,15],"vi_vidro_int_parabrisa":[400,30],"vi_vidro_int_tras":[40,30]};
export const POS_VEI_INT_E = {"vi_volante":[115,195],"vi_painel":[140,115],"vi_porta_luvas":[65,285],"vi_console":[200,295],"vi_parabrisa_int":[350,55],"vi_retrovisor_int":[265,75],"vi_banco_pass":[320,245],"vi_banco_mot":[445,240],"vi_apoio_cab_mot":[465,120],"vi_banco_tras_d":[585,200],"vi_banco_tras_e":[715,200],"vi_cinto_seg":[390,205],"vi_assoalho_ant":[300,385],"vi_assoalho_pos":[655,385],"vi_forro_teto":[555,45],"vi_porta_int_ant_e":[200,360],"vi_porta_int_pos_e":[680,360],"vi_vidro_int_ant_e":[140,15],"vi_vidro_int_pos_e":[680,15],"vi_vidro_int_parabrisa":[400,30],"vi_vidro_int_tras":[760,30]};

// Moto — viewBox 800x400.
export const POS_MOTO_LAT = {"mle_guidao":[80,155],"mle_tanque":[170,200],"mle_assento":[260,185],"mle_motor":[210,260],"mle_roda_d":[85,305],"mle_roda_t":[325,305],"mld_guidao":[720,155],"mld_tanque":[630,200],"mld_assento":[540,185],"mld_motor":[590,260],"mld_roda_d":[715,305],"mld_roda_t":[475,305]};
export const POS_MOTO_FT = {"mf_farol":[195,105],"mf_retrov_e":[85,75],"mf_retrov_d":[305,75],"mf_roda":[200,310],"mt_lanterna":[565,105],"mt_placa":[565,165],"mt_roda":[570,310]};
export const POS_MOTO_SUP = {"ms_guidao":[550,105],"ms_tanque":[325,200],"ms_assento":[475,200],"ms_motor":[450,300]};

// Bicicleta — viewBox 800x250 (lateral), 800x400 (frente/tras/sup).
export const POS_BICI_LAT = {"ble_guidao":[300,45],"ble_quadro":[220,110],"ble_assento":[190,45],"ble_roda_d":[90,180],"ble_roda_t":[320,180],"bld_guidao":[500,45],"bld_quadro":[580,110],"bld_assento":[610,45],"bld_roda_d":[710,180],"bld_roda_t":[480,180]};
export const POS_BICI_FT = {"bf_guidao":[200,55],"bf_roda":[225,260],"bt_assento":[575,60],"bt_roda":[575,260]};
export const POS_BICI_SUP = {"bs_guidao":[675,195],"bs_quadro":[400,200],"bs_assento":[210,195],"bs_pedal_d":[300,75],"bs_pedal_e":[300,325]};

// Ônibus — viewBox 800x360 (laterais), 800x400 (frente/tras), 400x800 (interior vertical).
export const POS_BUS_LAT_E = {"bse_frente":[105,150],"bse_meio":[400,150],"bse_tras":[705,150],"bse_roda_d":[180,295],"bse_roda_t":[640,295]};
export const POS_BUS_LAT_D = {"bsd_frente":[705,150],"bsd_meio":[400,150],"bsd_tras":[105,150],"bsd_roda_d":[640,295],"bsd_roda_t":[180,295]};
export const POS_BUS_FT = {"bf_parabrisa":[200,125],"bf_farol_e":[110,300],"bf_farol_d":[290,300],"bf_parachoque":[200,365],"bt_visor":[600,125],"bt_lanterna_e":[510,300],"bt_lanterna_d":[690,300],"bt_motor":[600,225]};
export const POS_BUS_INT = {"bi_motorista":[110,70],"bi_painel":[260,70],"bi_porta_frente":[260,145],"bi_ass_e_frente":[110,240],"bi_ass_d_frente":[290,240],"bi_corr_frente":[200,240],"bi_porta_meio":[260,335],"bi_ass_e_meio":[110,430],"bi_ass_d_meio":[290,430],"bi_corr_meio":[200,430],"bi_ass_e_tras":[110,590],"bi_ass_d_tras":[290,590],"bi_corr_tras":[200,590]};

// Helper: veículo "tem dado preenchido" (campo de texto OU vestígio veicular).
export const hasVehicleData = (d, vi, veiVestArr) => {
  const vx = "v" + vi + "_";
  if (VEHICLE_FIELDS.some(f => d[vx + f])) return true;
  return Array.isArray(veiVestArr) && veiVestArr.some(v => (v.veiculo == null ? 0 : v.veiculo) === vi);
};

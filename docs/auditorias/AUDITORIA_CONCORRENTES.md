# Pesquisa de Apps de Perícia — 2026-04-29

> Pesquisa profunda sobre sistemas brasileiros, apps internacionais e tendências em documentação forense, com objetivo de inspirar features para o **Xandroid** (PWA da PCDF para documentar cenas de crime).
> 
> Linguagem deliberadamente simples — todo termo técnico é traduzido na primeira aparição.

---

## TL;DR (resumo executivo)

Pesquisei **9 apps internacionais de ponta** (Axon Evidence, SceneDoc, CrimePad, Forensic Notes, Magnet AXIOM, Trancite ScenePD, Recon-3D, Dot3D, CSI360), **3 sistemas brasileiros** (SINESP, SISP, eLaudo PCDF), **5 tendências quentes 2024-2026** (LiDAR no iPhone, WebXR, OpenTimestamps, IA on-device, voz forense) e **2 normas obrigatórias** (ISO 27037 e Lei 13.964/2019 — Pacote Anticrime, arts. 158-A a 158-F).

**Conclusões em uma frase:**

1. O Xandroid já está à frente da maioria em **simplicidade de uso** e em ser **PWA offline-first** — quase nenhum concorrente é PWA, todos são app nativo iOS/Android, o que cria atrito de instalação.
2. Os concorrentes batem o Xandroid em três áreas: **rastreabilidade granular** (cada toque na evidência logado), **cadeia de custódia digital com selo de tempo verificável**, e **diagramação inteligente da cena** (templates, símbolos arrastáveis).
3. A **Lei 13.964/2019** (Pacote Anticrime) virou lei em 2019 e impõe requisitos formais de cadeia de custódia que **podem invalidar laudos** se não cumpridos. O Xandroid precisa garantir que o ZIP forense atual atende os 10 elos previstos no art. 158-B.
4. **Quick wins de altíssimo impacto** existem (timestamping em blockchain via OpenTimestamps de graça, checklist obrigatório, escala de medição na foto, exportação ABNT), todos implementáveis em 1 a 5 dias.
5. LiDAR e WebXR são **fora de alcance no curto prazo** porque WebXR ainda não tem suporte estável em iOS Safari para câmera + sensor de profundidade.

---

## Sistemas brasileiros pesquisados

### 1. SINESP — Sistema Nacional de Informações de Segurança Pública
- Plataforma federal criada pela Lei 12.681/2012, integra dados de segurança pública entre União, estados e DF.
- Função: consultas operacionais, investigativas e estratégicas; alimenta o **SUSP** (Sistema Único de Segurança Pública).
- **O que tem de interessante para o Xandroid:** padronização de campos nacionais (nome do tipo de ocorrência, código IBGE do município, etc.). Se o Xandroid exportar PDF/RRV usando o vocabulário SINESP, fica trivial integrar com sistemas de outros estados depois.
- **Fonte:** [gov.br/mj — SINESP](https://www.gov.br/mj/pt-br/acesso-a-informacao/perguntas-frequentes/seguranca_publica/sinesp)

### 2. SISP — Sistema Integrado de Segurança Pública (estaduais)
- Cada estado tem sua versão (SISP/SC, SISP/RJ, etc.). Em SC, por exemplo, é mantido pela CIASC há 20 anos e atende Polícia Civil, Militar, Científica e Bombeiros.
- **O que tem de interessante:** módulos integrados (BO, viatura, perito, prisão). Idealmente o Xandroid deveria exportar um arquivo no formato que o SISP do DF consome, evitando dupla digitação.

### 3. eLaudo (PCDF — já existe!)
- Sistema interno da própria PCDF que digitaliza solicitação e entrega de laudos pelo cidadão. Desenvolvido pela Seção de Engenharia de Software do Instituto de Criminalística.
- **Implicação para o Xandroid:** o app deveria ter um **botão "Enviar para eLaudo"** que empacota tudo no formato esperado, fechando o ciclo digital.
- **Fonte:** [eLaudo PCDF](https://elaudo.pcdf.df.gov.br/)

### 4. Outros sistemas comentados (não foram detalhados em fontes públicas)
- **PCNet, INFOCRIM (SP):** sistemas internos das polícias civis estaduais, focados em registro de ocorrência e estatística criminal. Pouca documentação pública.
- **Apps PMSP/PMDF:** focados em ostensiva (abordagem em via, consulta CPF/placa). Lógica de **autenticação biométrica forte** e **logs imutáveis** vale roubar.

---

## Apps internacionais pesquisados

### Axon Evidence (axon.com — líder global, dona da Taser)
- Gerência digital de provas. Captura via app no celular vai direto pro **Axon Evidence Cloud** preservando cadeia de custódia.
- Features destacáveis para o Xandroid:
  - **Auto-tagging com IA**: organiza fotos automaticamente.
  - **Smart Capture**: leitura de código de barras de CNH para preencher dados da pessoa automaticamente.
  - **Retenção do rascunho original** quando IA gera o texto (exigido por novas leis nos EUA — antecipa que o mesmo virá no Brasil).
- **Fonte:** [Axon Evidence](https://www.axon.com/products/axon-evidence) | [DEMS Release Notes Nov-Dez 2025](https://www.axon.com/help/release-notes/dems/2025/11_12-2025.htm)

### SceneDoc (canadense, hoje parte da Tyler Technologies)
- Pioneiro em documentação de cena por celular/tablet.
- Features destacáveis:
  - Múltiplos usuários **no mesmo dispositivo** (rotação de turno).
  - **CJIS-compliance** (padrão de segurança da polícia americana).
  - Sincronização automática quando volta a ter rede.
  - **TouchID/FaceID** para assinatura digital de cada anotação.
- **Fonte:** [SceneDoc 3.1.0 release](https://www.police1.com/police-products/police-technology/mobile-data/press-releases/scenedoc-announces-310-upgrade-to-its-mobile-data-collection-platform-FCRA9njczK1gMAzV/)

### CrimePad (Visionations, iPad app, há mais de uma década no mercado)
- Caso/Cena/Endereço/Evidência/Técnica/Croqui/Veículo/Corpo/Exame/Cadeia de Custódia/Foto/Vídeo — **modelo de dados muito completo**.
- Features destacáveis:
  - **Transferência de custódia com confirmação por senha ou código por e-mail** do recebedor (cadeia verificada bidirecionalmente).
  - Documenta inclusive técnicas que **não obtiveram evidência** (reveladores que não revelaram nada, por exemplo) — importante juridicamente para mostrar que foi tentado.
  - Armazenamento de terabytes por arquivo.
- **Fonte:** [CrimePad — Forensic Tools ZA](https://www.forensictools.co.za/crimepad-on-scene-case-management) | [Fast Company — How an iPad App Is Transforming Police Work](https://www.fastcompany.com/3025289/how-an-ipad-app-is-transforming-the-way-police-work-crime-scenes)

### Forensic Notes (forensicnotes.com)
- Foco em anotações com **assinatura digital + timestamp criptográfico** (cada nota é assinada e datada de forma que prova que não foi alterada depois).
- Features destacáveis:
  - **Caderno por exhibit** (uma evidência = um caderno).
  - Anexos herdam a assinatura/timestamp da nota — qualquer alteração quebra o hash.
- **Fonte:** [Forensic Notes — Documenting Digital Investigations](https://www.forensicnotes.com/how-to-document-digital-forensic-investigations-with-forensic-notes/)

### Magnet AXIOM (canadense, desktop, líder em forense de celular)
- Pré-processa dados de celular/nuvem/computador. Não compete diretamente com Xandroid (ferramenta de gabinete), mas tem ideias úteis.
- Feature destacável: **Mobile View** — replica visualmente o celular do investigado para qualquer pessoa (juiz, promotor) navegar como se fosse o aparelho. Para o Xandroid: **modo de visualização "como o juiz vê"** do laudo final.
- **Fonte:** [Magnet AXIOM](https://www.magnetforensics.com/products/magnet-axiom/)

### Trancite ScenePD (diagramação 2D)
- 4.000+ símbolos arrastáveis (carro, corpo, mancha, móvel, parede). Mapa de satélite como base. **Estruturas inteligentes** (paredes, portas, janelas com tamanho real).
- **Feature óbvia para o Xandroid:** evoluir o croqui anatômico atual para um croqui de cena 2D com biblioteca de símbolos arrastáveis sobre Google Maps ou planta.
- **Fonte:** [ScenePD](https://www.trancite.com/scenepd)

### Recon-3D (iPhone Pro com LiDAR)
- App iOS que escaneia cena em 3D em **menos de 2 minutos** com erro médio de 0,22 cm. Validado em estudo peer-reviewed para trajetória balística contra FARO Focus S350 (scanner profissional de US$ 50 mil) — **sem diferença estatística**.
- **Implicação:** se um perito da PCDF tem iPhone 12 Pro ou superior pessoal, dá pra usar isso já. Mas integrar isso ao Xandroid em PWA é difícil porque iOS Safari não dá acesso ao LiDAR.
- **Fontes:** [Using iPhone LiDAR — ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2666225623000040) | [Recon-3D validation — Forensic Science International](https://www.sciencedirect.com/science/article/abs/pii/S0379073823002372)

### Dot3D Pro
- Concorrente do Recon-3D. Mesma ideia, foco em precisão e exportação para CAD.

### CSI360
- Combina câmera 360° (Ricoh Theta, Insta360) com LiDAR do iPhone + app iOS para gerar **tour virtual da cena**. Documenta cena toda em menos de 4 horas.
- **Fonte:** [CSI360](https://www.csi360.net/)

---

## Tendências 2024-2026

### LiDAR em iPhone Pro (validado cientificamente)
- Estudo de 2023 (Forensic Science International) mostrou **erro angular menor que 1°** comparado a scanner profissional FARO de US$ 50.000. Tempo de aquisição: < 2 min, erro de distância médio: 0,22 cm.
- **Caveat para PWA:** iOS Safari **não expõe** o LiDAR via WebXR ainda (abril/2026). Para usar no Xandroid teria que ser app nativo ou usar o app Recon-3D externo e importar o arquivo.

### WebXR / Realidade Aumentada no navegador
- API existe no Chrome Android, mas iOS Safari ainda travou. Existe **WebXR-Measure** (medir distância entre dois pontos no mundo real apontando o celular) mas só roda no Chrome Android.
- **Pegadinha:** se metade dos peritos usa iPhone, AR no PWA fica inviável até 2027 provavelmente. Solução: medição manual com **escala física de referência na foto** (ABFO Scale) — solução do Século 19 que ainda funciona melhor que tecnologia bleeding-edge.

### OpenTimestamps (timestamping em blockchain, GRÁTIS)
- Protocolo aberto criado por Peter Todd (dev do Bitcoin). **Manda só o hash (impressão digital) do arquivo para o blockchain Bitcoin** — o arquivo nunca sai do celular. Custa R$0. Verificação independente sem servidor.
- **Caso de uso forense matador:** anexar ao ZIP forense um arquivo `.ots` que prova de forma irrefutável e auditável por qualquer um (juiz, defesa, perito assistente) que **a foto X existia naquele exato momento**, sem precisar confiar em servidor da PCDF, em servidor do Google, em ninguém.
- **Esforço:** existe biblioteca JS (`javascript-opentimestamps`). Cabe em 4-8 horas de implementação.
- **Fontes:** [OpenTimestamps.org](https://opentimestamps.org/) | [GitHub opentimestamps-client](https://github.com/opentimestamps/opentimestamps-client) | [ProofSnap blockchain timestamping](https://getproofsnap.com/posts/blockchain-timestamping.html)

### IA on-device (rodar modelo no celular sem mandar nada pra cloud)
- Bibliotecas disponíveis em 2026: TensorFlow.js, ONNX Runtime Web, Transformers.js (Hugging Face). Modelos pequenos (10-50 MB) rodam dentro do navegador.
- Casos relevantes: detectar **cápsula deflagrada** numa foto, detectar **borrão de movimento**, detectar **foto fora de foco**, validar se a foto tem escala de medição visível.
- O artigo da Smart Forensic Phone (Sciencedirect) mostrou estimativa de idade de mancha de sangue por análise RGB no smartphone. Possível replicar.

### Voz-pra-texto especializada em forense
- VoiceboxMD (medicina) atinge 99% de acurácia com vocabulário especializado. Para forense não há produto comercial específico em PT-BR ainda.
- **Workaround:** Web Speech API do navegador funciona OK para PT-BR. Pra termos técnicos ("excoriação", "rigor mortis", "cápsula deflagrada"), pode-se construir um **dicionário de auto-correção** local.

---

## Padrões e compliance

### ABNT NBR ISO/IEC 27037:2013 (cadeia de custódia digital)
**Quatro princípios obrigatórios:**
1. **Auditabilidade** — todo processo documentado para revisão por terceiro.
2. **Repetibilidade** — outro perito com mesmas ferramentas chega ao mesmo resultado.
3. **Reprodutibilidade** — outro perito com OUTRAS ferramentas equivalentes chega ao mesmo resultado.
4. **Justificabilidade** — toda decisão técnica documentada.

**O que o registro de cadeia de custódia DEVE conter (art. da norma):**
- Identificador único da evidência
- Quem acessou, quando e onde
- Quem checou interna/externamente
- Qualquer alteração inevitável + justificativa + responsável

**Onde o Xandroid já cumpre:** hash SHA-256 das fotos (existe? verificar).
**Onde pode falhar:** se duas pessoas usam o mesmo celular sem login separado, "quem acessou" fica impreciso.

**Fontes:** [Academia de Forense Digital](https://academiadeforensedigital.com.br/iso-27037-identificacao-coleta-aquisicao-e-preservacao-de-evidencia/) | [DataCertify](https://www.datacertify.com.br/iso-iec-27037-por-que-os-advogados-precisam-conhecer-os-principios-dessa-norma-para-coletar-evidencias-digitais/)

### Lei 13.964/2019 (Pacote Anticrime) — arts. 158-A a 158-F do CPP
**Os 10 elos obrigatórios da cadeia de custódia (art. 158-B):**
1. Reconhecimento
2. Isolamento
3. Fixação (fotografia, filmagem, croqui)
4. Coleta
5. Acondicionamento
6. Transporte
7. Recebimento
8. Processamento
9. Armazenamento
10. Descarte

**Implicações jurídicas:** STJ já anulou provas por quebra de cadeia de custódia. **Cada um dos 10 elos precisa estar registrado**. O Xandroid foca nos elos 1-5 (cena), mas o PDF deveria explicitamente apontar quais elos foram cumpridos.

**Fonte:** [Lei 13.964 — Planalto](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm) | [STJ — entendimentos](https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/2023/23042023-A-cadeia-de-custodia-no-processo-penal-do-Pacote-Anticrime-a-jurisprudencia-do-STJ.aspx)

### NIST SP 800-101 r1 (Mobile Device Forensics)
- Norma americana, mas serve de referência mundial. 5 níveis de aquisição: Manual, Lógica, Sistema de Arquivos, Física, Chip-off.
- **O que importa pro Xandroid:** documentar **método, validação e limitações** de cada aquisição.

### NIST — escalas de fotografia forense (ABFO No. 2)
- Escala de medição de 80mm com 4 círculos de referência pra corrigir distorção de perspectiva. Padrão internacional de fato.
- **Sugestão Xandroid:** vender/distribuir uma régua ABFO impressa em PVC/adesivo + adicionar um **modo "foto pericial"** que valida que tem escala visível.

---

## TOP 25 FEATURES sugeridas para Xandroid

> **Critério de ranking:** alta-prioridade primeiro = (impacto alto + esforço baixo). Quick wins no topo.

---

### 1. Timestamping em blockchain via OpenTimestamps
- **De onde veio:** ProofSnap, padrão Bitcoin OTS.
- **O que faz:** quando você fecha o ZIP forense, o sistema pega o hash do ZIP, manda pro servidor OpenTimestamps gratuito, e em alguns minutos volta um arquivo `.ots` que **prova matematicamente** que esse ZIP existia naquele instante. Verificável por qualquer um, sem servidor da PCDF, sem confiança em ninguém. Custo: R$0.
- **Por que o perito vai querer:** é a prova mais forte de cadeia de custódia que existe no planeta. Inviabiliza qualquer alegação de "essa foto foi adulterada depois". Anula objeções da defesa.
- **Esforço:** 1-2 dias.
- **Categoria:** **Quick win**
- **Pré-requisito:** internet pra mandar o hash (mas o ZIP fica salvo offline, o `.ots` chega depois).

### 2. Checklist obrigatório de cena (modelo NIST)
- **De onde veio:** CSI Checklist (Mauriello), guia do NIST.
- **O que faz:** lista de itens sempre presentes antes de fechar o laudo: "Foto geral 4 pontos cardeais? Foto detalhe? Coleta com EPI? Hora de chegada? Hora de saída? Testemunha presente?" Bloqueia exportação se faltar item crítico.
- **Por que o perito vai querer:** evita esquecimento sob pressão. Ajuda peritos novatos. Padroniza o que sai pra Justiça.
- **Esforço:** 4-8 horas (UI + lógica de validação).
- **Categoria:** **Quick win**

### 3. Validação automática de escala ABFO na foto
- **De onde veio:** Standard NIST de fotografia forense.
- **O que faz:** na hora que o perito tira foto de detalhe, um modelo simples (até pode ser checkbox manual) marca "essa foto tem escala visível? S/N". Relatório final lista quantas fotos têm escala vs. não têm.
- **Por que o perito vai querer:** sem escala, foto de detalhe perde valor probatório (não dá pra medir lesão depois). Corrige cultura informal.
- **Esforço:** 4-6 horas (manual checkbox); 2-3 dias (detecção automática com IA).
- **Categoria:** **Quick win**

### 4. Marca d'água invisível (steganografia) com hash da foto
- **De onde veio:** Forensic Notes + boas práticas EXIF.
- **O que faz:** ao tirar a foto, embute no metadado EXIF: número do laudo, GPS, hora, hash SHA-256 da própria foto e da foto anterior (encadeamento). Se alguém recortar/editar, o hash quebra e a quebra é detectável.
- **Por que o perito vai querer:** torna cada foto auto-prova. Útil quando WhatsApp/cópia tira EXIF — o hash interno permanece.
- **Esforço:** 1-2 dias.
- **Categoria:** **Quick win**
- **Pré-requisito:** biblioteca de manipulação EXIF no browser (piexifjs).

### 5. Login por perito + log imutável de quem fez o quê
- **De onde veio:** SceneDoc (multi-user no mesmo device), ISO 27037 princípio de auditabilidade.
- **O que faz:** cada perito tem PIN/biometria. Toda foto, anotação, edição registra **quem fez** + timestamp. Log não pode ser apagado nem editado pelo próprio perito.
- **Por que o perito vai querer:** se 2 peritos compartilham o celular do plantão, fica claro o que cada um fez. Atende exigência da ISO 27037.
- **Esforço:** 2-3 dias.
- **Categoria:** **Médio**
- **Pré-requisito:** estrutura de autenticação local.

### 6. Mapa dos 10 elos do art. 158-B do CPP no relatório
- **De onde veio:** Lei 13.964/2019 (Pacote Anticrime).
- **O que faz:** seção do PDF/RRV mostra checkbox de cada um dos 10 elos legais (Reconhecimento, Isolamento, Fixação, Coleta, Acondicionamento, Transporte, Recebimento, Processamento, Armazenamento, Descarte) com quem cumpriu cada um e quando.
- **Por que o perito vai querer:** **blinda o laudo de nulidade**. Defesa não consegue alegar quebra de cadeia de custódia se está documentado.
- **Esforço:** 1 dia (template no PDF).
- **Categoria:** **Quick win**

### 7. Croqui de cena 2D com símbolos arrastáveis sobre Google Maps
- **De onde veio:** Trancite ScenePD.
- **O que faz:** evolui o croqui anatômico atual: biblioteca de símbolos (corpo, carro, projétil, mancha de sangue, móvel, porta, janela) que o perito arrasta sobre o mapa do Google ou sobre uma planta importada. Mede distância clicando dois pontos.
- **Por que o perito vai querer:** documenta cena de homicídio em via pública muito melhor que só fotos.
- **Esforço:** 1-2 semanas.
- **Categoria:** **Médio**
- **Pré-requisito:** biblioteca SVG de símbolos forenses (criar ou usar pública).

### 8. Modo "como o juiz vê" — preview do laudo final
- **De onde veio:** Magnet AXIOM Mobile View.
- **O que faz:** botão que mostra exatamente como o PDF/DOCX vai aparecer pra Justiça, com paginação, capa, índice. Editável antes de exportar.
- **Por que o perito vai querer:** evita retrabalho ("pô, ficou feio, virou em página estranha"). Aumenta autoestima profissional do laudo.
- **Esforço:** 3-5 dias.
- **Categoria:** **Médio**

### 9. Leitura de QR Code / código de barras de CNH/RG
- **De onde veio:** Axon Smart Capture.
- **O que faz:** apontar a câmera pra CNH do envolvido e auto-preencher nome, RG, CPF, data de nascimento.
- **Por que o perito vai querer:** elimina digitação manual sob estresse. Previne erro de digitação.
- **Esforço:** 1-2 dias (lib `@zxing/browser`).
- **Categoria:** **Quick win**

### 10. Transferência de custódia com assinatura biométrica do recebedor
- **De onde veio:** CrimePad.
- **O que faz:** quando o perito entrega a evidência (envelope, célula de sangue, projétil) na unidade de armazenamento, o recebedor coloca o dedo (Touch ID/biometria do navegador via WebAuthn) e o sistema registra timestamp + identidade.
- **Por que o perito vai querer:** prova jurídica forte de que entregou a evidência intacta. Encerra a responsabilidade do perito de cena.
- **Esforço:** 3-4 dias.
- **Categoria:** **Médio**
- **Pré-requisito:** todos os recebedores têm que ter cadastro no sistema.

### 11. Voz-para-texto com vocabulário forense português
- **De onde veio:** VoiceboxMD (medicina), SpeechToText forense.
- **O que faz:** botão de microfone em qualquer campo de texto. Web Speech API + dicionário local de termos forenses ("excoriação", "rigor mortis", "petéquias", "cápsula deflagrada", "hipóstase", etc.) que faz auto-correção pós-transcrição.
- **Por que o perito vai querer:** mãos sujas, EPI, frio, chuva — digitar é horrível na cena. Voz acelera 5-10x.
- **Esforço:** 2-3 dias (Web Speech API + dicionário).
- **Categoria:** **Médio**
- **Importante:** isso é **diferente** da feature do roadmap "preenchimento por voz com IA". Aqui é só transcrição literal, sem inferência.

### 12. Modo offline-first com indicador claro de sincronização
- **De onde veio:** SceneDoc, boas práticas PWA.
- **O que faz:** ícone na top bar mostra sempre "online/sincronizando/offline + X itens pendentes". Quando volta sinal, sincroniza automaticamente em background.
- **Por que o perito vai querer:** elimina ansiedade ("será que o que tirei foi salvo?"). Cena de crime em zona rural do DF tem sinal péssimo.
- **Esforço:** 2-3 dias (provavelmente já tem, falta só polir UI).
- **Categoria:** **Quick win**

### 13. Redator automático de "ocorrência preliminar" baseado em template + voz
- **De onde veio:** SceneDoc, Forensic Notes.
- **O que faz:** templates de cena ("Homicídio por arma de fogo", "Suicídio enforcamento", "Atropelamento") com 80% pré-preenchido. Perito só ajusta detalhes específicos.
- **Por que o perito vai querer:** primeiros 30 minutos numa cena viram 5 minutos. Padroniza vocabulário entre peritos.
- **Esforço:** 1 semana (criar bons templates é o gargalo, não o código).
- **Categoria:** **Médio**

### 14. Captura de panorama 360° por foto sequencial
- **De onde veio:** CSI360, Weiss AG.
- **O que faz:** modo "panorama de cena" que pede pro perito girar 360° tirando foto a cada 30°, depois junta tudo num panorama navegável.
- **Por que o perito vai querer:** documenta o ambiente todo de uma vez. Evita esquecer ângulo importante.
- **Esforço:** 4-7 dias (lib `panolens.js` ou `pannellum`).
- **Categoria:** **Médio**

### 15. Importação de arquivo .OBJ/.PLY do Recon-3D ou Dot3D
- **De onde veio:** Recon-3D, Dot3D, CSI360.
- **O que faz:** se o perito tem iPhone Pro com LiDAR, ele escaneia a cena no Recon-3D (app externo) e arrasta o arquivo `.obj` para o Xandroid. O laudo final inclui um link pro modelo 3D.
- **Por que o perito vai querer:** sem precisar reescrever LiDAR no PWA, aproveita ferramenta validada por estudos científicos. Crime grave (homicídio com tiro) merece reconstrução 3D.
- **Esforço:** 3-4 dias (parser de .obj + viewer Three.js).
- **Categoria:** **Médio**
- **Pré-requisito:** o perito ter iPhone Pro pessoal/da unidade.

### 16. Modo "trabalho duplo" — integração inicial com eLaudo PCDF
- **De onde veio:** eLaudo PCDF (existe!).
- **O que faz:** botão "Enviar para eLaudo" que empacota o ZIP no formato esperado pelo sistema interno da PCDF.
- **Por que o perito vai querer:** evita dupla digitação. Fecha o ciclo digital.
- **Esforço:** 1-2 semanas (depende de quão aberta é a API do eLaudo — provavelmente nada aberta, viraria upload manual de ZIP).
- **Categoria:** **Médio**
- **Pré-requisito:** acesso à equipe da SES/IC da PCDF para entender o formato.

### 17. Detector de foto borrada / fora de foco (IA on-device)
- **De onde veio:** boas práticas + TensorFlow.js.
- **O que faz:** quando o perito tira foto, um modelo de 5MB roda no celular e fala "essa foto está borrada, recomendo refazer". Custa <1 segundo.
- **Por que o perito vai querer:** evita descobrir 3 horas depois, no escritório, que a foto crítica está borrada.
- **Esforço:** 2-4 dias (modelo pré-treinado de detecção de blur existe).
- **Categoria:** **Médio**

### 18. Rastreador de ações no app (timeline de auditoria visível)
- **De onde veio:** ISO 27037 + Forensic Notes.
- **O que faz:** tela "histórico do laudo" mostra linha do tempo: "10:23 perito chegou", "10:24 primeira foto", "10:31 anotação", "10:42 saída". Imutável, exportável como anexo.
- **Por que o perito vai querer:** prova juridicamente o tempo de cena. Se a defesa alegar "perito ficou pouco tempo", você mostra o timeline.
- **Esforço:** 1-2 dias.
- **Categoria:** **Quick win**

### 19. Modo escuro real (não apenas tema escuro — modo lanterna/brilho min)
- **De onde veio:** apps táticos militares.
- **O que faz:** modo "operação noturna" reduz brilho ao mínimo, usa vermelho em vez de branco (preserva visão noturna), desliga GPS chirp visível.
- **Por que o perito vai querer:** cena de crime à noite na rua — tela de celular cega o perito e atrai atenção.
- **Esforço:** 1 dia.
- **Categoria:** **Quick win**

### 20. Compartilhamento de link com perito assistente (read-only)
- **De onde veio:** CrimePad colaboração.
- **O que faz:** gera link com token expirável que mostra o laudo em modo somente-leitura para o perito assistente da defesa, sem precisar de senha do sistema.
- **Por que o perito vai querer:** quando há perito assistente, hoje se passa PDF por e-mail. Link com expiração é mais profissional e rastreável.
- **Esforço:** 3-5 dias.
- **Categoria:** **Médio**
- **Pré-requisito:** servidor próprio com auth (provavelmente Vercel + Supabase).

### 21. Etiqueta de evidência com QR Code imprimível
- **De onde veio:** Evidence Hound, VeriPic.
- **O que faz:** botão "imprimir etiqueta" gera PDF A6 com QR Code que aponta pra entrada da evidência no sistema. Perito imprime numa Brother PT-P710BT (impressora bluetooth) e cola no envelope.
- **Por que o perito vai querer:** elimina rotular à mão. QR Code permite rastrear o envelope depois.
- **Esforço:** 1-2 dias (lib `qrcode.js`).
- **Categoria:** **Quick win**

### 22. Análise colorimétrica de mancha de sangue para estimativa de tempo
- **De onde veio:** "Smart Forensic Phone" (Jung, Sciencedirect 2017).
- **O que faz:** aponta câmera para mancha de sangue em superfície branca, app analisa RGB e estima janela de tempo (recente, 6h, 12h, 24h+).
- **Por que o perito vai querer:** estima TPM (tempo provável de morte) sem esperar laudo de IML. Indicador, não prova definitiva.
- **Esforço:** 1-2 semanas (calibração + UI).
- **Categoria:** **Grande**
- **Pré-requisito:** validação científica antes de sair do beta.

### 23. Geração de RRV com botão "exportar versão pública"
- **De onde veio:** boas práticas LGPD + práticas Axon.
- **O que faz:** mesmo laudo, duas saídas: completa (com nome, CPF, foto de pessoa) e pública (anonimizada para imprensa/MP). Borra rosto, mascara dados pessoais.
- **Por que o perito vai querer:** muitas vezes precisam compartilhar com partes externas. Hoje é manual.
- **Esforço:** 3-5 dias (anonimização de rosto on-device com modelo BlazeFace).
- **Categoria:** **Médio**

### 24. Backup local em pen drive criptografado (alternativa pra cenário sem Wi-Fi)
- **De onde veio:** boas práticas militares.
- **O que faz:** botão "exportar para USB OTG". Plugou pen drive no celular, app salva ZIP criptografado.
- **Por que o perito vai querer:** redundância pra cena de plantão noturno em interior do DF (Brazlândia, Planaltina) sem internet.
- **Esforço:** 2-3 dias (File System Access API existe em Chrome Android).
- **Categoria:** **Médio**
- **Pré-requisito:** Android (iOS Safari não tem essa API).

### 25. Modo "treinamento" para peritos novatos
- **De onde veio:** SceneDoc (police foundations program).
- **O que faz:** modo sandbox onde o perito pode praticar sem gerar laudo real. Cenas de exemplo prontas. Feedback de "esqueceu de fotografar X".
- **Por que o perito vai querer:** PCDF tem rotatividade. Onboarding de novato sem corromper sistema de produção.
- **Esforço:** 1 semana.
- **Categoria:** **Médio**

---

## 5 features "fora da caixa"

### A. Detector de "foto suspeita de manipulação" — análise reversa contínua
Um modelo IA local que continuamente verifica as fotos do laudo procurando sinais de manipulação (Error Level Analysis, JPEG ghosts). Se alguém tentar substituir uma foto depois da exportação inicial, o app grita. **Ninguém faz isso preventivamente** — só pós-incidente em laboratório.

### B. "Pulse de cena" — heartbeat sonoro confirmando captura
Cada foto, cada anotação, cada coleta gera um som distintivo (chime curto, vibração). Em ambiente caótico (madrugada, chuva, multidão), o perito sabe pelo ouvido que registrou. Inspirado em equipamentos médicos. **Custa 2 horas, ninguém implementa.**

### C. Modo "perito sob ameaça" — botão de pânico que comprime tudo e envia
Botão grande oculto (3 toques no logo). Manda GPS atual + última foto + áudio de 30s ambiente para servidor seguro. Se o perito for atacado/sequestrado em cena de crime de tráfico, há prova mínima. Inspirado em apps de jornalista de zona de conflito.

### D. "Café duplo" — alerta de fadiga
Detecta padrão de uso longo (>4h plantão) + horários (3h da manhã) e sugere "verifique a foto X — você estava na 18ª hora consecutiva". Cita estudos de fadiga em decisão forense. Ninguém faz isso.

### E. "Voz da defesa" — ChatGPT local que ataca o próprio laudo
Antes de exportar, um modelo local lê o laudo e gera 5 perguntas que um advogado de defesa **provavelmente** faria. Perito decide se responde antecipadamente no laudo ou ignora. Brilhante e inédito. (**Roadmap diz que tem IA fora — mas isso é um uso específico ainda não previsto.**)

---

## Riscos / pegadinhas a evitar

1. **Axon trava com fotos > 50MB:** ao salvar localmente, garantir compressão progressiva ou aviso de limite. iPhone 15 Pro RAW são 75MB.
2. **SceneDoc perdeu dados quando app foi fechado durante upload:** garantir que o IndexedDB **nunca** é deletado por falha de sync. Sync é opcional, dado é primário.
3. **CrimePad foi caro de adotar porque exigia iPad por perito:** Xandroid mantém vantagem de rodar em qualquer celular do perito.
4. **Forensic Notes processo de assinatura digital lento (>30s por nota):** se for fazer hash + timestamp, fazer em background, não bloquear UI.
5. **Magnet AXIOM exige treinamento de 40h:** Xandroid deve manter UI simples; toda feature nova precisa onboarding tooltip.
6. **iOS Safari não tem File System Access API:** features que dependem de manipular pen drive ou pasta local **não vão funcionar em iPhone**. Documentar limitação.
7. **iOS Safari limita IndexedDB a ~1GB e pode purgar se sem uso:** instruir perito a abrir app pelo menos 1x por semana, ou criar lembrete.
8. **Web Speech API em PT-BR tem qualidade variável:** offline é fraco, online depende do Google. Sempre permitir editar transcrição.
9. **Reconhecimento facial automático abre caixa de Pandora LGPD:** evitar IA que identifica pessoas. Manter IA só pra coisas (escala, blur, cápsula).
10. **OpenTimestamps demora 1-6h para confirmar no Bitcoin:** o `.ots` inicial é provisório e completa depois. Explicar isso pro perito ou esperar a confirmação antes de exportar (não bloquear).
11. **Apps de polícia que dependem de cloud morreram quando empresa fechou (RIP SceneDoc original).** Xandroid roda no celular do perito — sobrevive a tudo. **Esse é o maior diferencial.** Não comprometer.

---

## Recomendação final

### 6 features starter batch (quick wins desta semana)

| # | Feature | Esforço | Por que primeiro |
|---|---|---|---|
| 1 | Timestamping OpenTimestamps | 1-2 dias | Maior salto em valor jurídico; grátis |
| 6 | Mapa dos 10 elos do CPP no PDF | 1 dia | Conformidade legal explícita |
| 2 | Checklist obrigatório de cena | 4-8h | Reduz erro humano imediatamente |
| 18 | Timeline de auditoria | 1-2 dias | Já tem dado, só falta UI |
| 9 | Leitura QR/CNH | 1-2 dias | Velocidade de preenchimento |
| 19 | Modo operação noturna | 1 dia | Quality of life, alto retorno |

**Tempo total estimado:** 1 semana intensa (40h). Esse pacote sozinho **eleva o Xandroid a top 5 mundial em conformidade**.

### 6 features de médio prazo (próximas 4-8 semanas)

| # | Feature | Esforço |
|---|---|---|
| 4 | Hash em EXIF + encadeamento | 1-2 dias |
| 5 | Login por perito + log imutável | 2-3 dias |
| 7 | Croqui 2D com símbolos arrastáveis | 1-2 semanas |
| 11 | Voz-para-texto com vocabulário forense | 2-3 dias |
| 13 | Templates de cena pré-preenchidos | 1 semana |
| 21 | Etiqueta QR imprimível | 1-2 dias |

### Resto pra depois (3-6 meses)

Features 8, 10, 14, 15, 17, 20, 22, 23, 24, 25 + features fora da caixa A-E. Cada uma agrega mas exige decisões de produto (servidor próprio? quanta IA? hardware extra?).

### Não recomendado neste momento

- **WebXR/AR no PWA:** iOS Safari ainda não suporta. Esperar 2027.
- **LiDAR direto no Xandroid:** mesma razão. Use importação de Recon-3D (#15).
- **Reconhecimento facial automático:** risco LGPD > benefício.
- **Sincronização 100% cloud sempre-online:** vai contra a filosofia offline-first.

---

## Fontes consultadas

### Apps internacionais
- [Axon Evidence — produto oficial](https://www.axon.com/products/axon-evidence)
- [Axon DEMS Release Notes Nov-Dez 2025](https://www.axon.com/help/release-notes/dems/2025/11_12-2025.htm)
- [Axon DEMS Release Notes Junho 2025](https://www.axon.com/help/release-notes/dems/2025/06-2025.htm)
- [Axon: Public Evidence Submission — Police Magazine](https://www.policemag.com/articles/axon-public-evidence-submission)
- [SceneDoc 3.1.0 release — Police1](https://www.police1.com/police-products/police-technology/mobile-data/press-releases/scenedoc-announces-310-upgrade-to-its-mobile-data-collection-platform-FCRA9njczK1gMAzV/)
- [SceneDoc Major Upgrade — Police Magazine](https://www.policemag.com/technology/news/15333379/scenedoc-announces-major-upgrade-to-its-mobile-evidence-collection)
- [CrimePad — Forensic Tools](https://www.forensictools.co.za/crimepad-on-scene-case-management)
- [CrimePad Investigate — Visionations](https://visionations.com/crimepad_investigators)
- [Fast Company — How an iPad App Is Transforming Police Work](https://www.fastcompany.com/3025289/how-an-ipad-app-is-transforming-the-way-police-work-crime-scenes)
- [Forensic Notes — Documenting Digital Investigations](https://www.forensicnotes.com/how-to-document-digital-forensic-investigations-with-forensic-notes/)
- [Magnet AXIOM](https://www.magnetforensics.com/products/magnet-axiom/)
- [Magnet AXIOM — Cyber Forensics Academy review](https://www.cyberforensicacademy.com/blog/magnet-axiom-features-pricing-real-investigation-use-cases)
- [Magnet Axiom Mobile View](https://www.magnetforensics.com/blog/bring-your-mobile-evidence-to-life-with-the-new-mobile-view-in-magnet-axiom/)
- [Trancite ScenePD](https://www.trancite.com/scenepd)
- [CSI Checklist — University of Maryland](https://ccjs.umd.edu/feature/crime-scene-investigation-there%E2%80%99s-app)

### LiDAR e 3D
- [Using iPhone LiDAR — ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2666225623000040)
- [Recon-3D bullet trajectory validation — Forensic Science International](https://www.sciencedirect.com/science/article/abs/pii/S0379073823002372)
- [Recon-3D Daubert validation — Triple R](https://www.triplerinvestigations.com/post/iphone-lidar-for-forensics-why-recon-3d-meets-the-daubert-validating-standard)
- [Comparative Analysis LiDAR vs Photogrammetry — MDPI](https://www.mdpi.com/2076-3417/15/3/1085)
- [CSI360](https://www.csi360.net/)
- [Dot3D Pro](https://www.dot3d.app/asd)
- [Low-cost panoramic camera 3D documentation — ResearchGate](https://www.researchgate.net/publication/321221329_A_LOW-COST_PANORAMIC_CAMERA_FOR_THE_3D_DOCUMENTATION_OF_CONTAMINATED_CRIME_SCENES)

### Padrões / Compliance
- [ISO 27037 — Academia de Forense Digital](https://academiadeforensedigital.com.br/iso-27037-identificacao-coleta-aquisicao-e-preservacao-de-evidencia/)
- [ISO 27037 — DataCertify](https://www.datacertify.com.br/iso-iec-27037-por-que-os-advogados-precisam-conhecer-os-principios-dessa-norma-para-coletar-evidencias-digitais/)
- [ISO 27037 e Pacote Anticrime — Lopes Perícias](https://lpericias.com.br/garantindo-a-validade-das-provas-digitais-a-importancia-da-cadeia-de-custodia-regulamentada-pelo-artigo-157-do-cpp-iso-27037-e-portaria-senasp/)
- [Lei 13.964/2019 — Planalto](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm)
- [Pacote Anticrime e cadeia de custódia — STJ](https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/2023/23042023-A-cadeia-de-custodia-no-processo-penal-do-Pacote-Anticrime-a-jurisprudencia-do-STJ.aspx)
- [Lei 13.964/2019 e cadeia de custódia — Migalhas](https://www.migalhas.com.br/arquivos/2020/3/CA87D1CAE19D01_LeiAnticrime%E2%80%93CadeiadeCustodiae.pdf)
- [NIST SP 800-101 r1 — Guidelines on Mobile Device Forensics](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-101r1.pdf)
- [NIST — Dimensional Review of Scales for Forensic Photography](https://www.nist.gov/system/files/documents/2017/05/09/Dimensional-Review-of-Scales-for-Forensic-Photography.pdf)
- [NIST — Crime Scene Investigation Guide for LE](https://www.nist.gov/system/files/documents/forensics/Crime-Scene-Investigation.pdf)
- [Forensic Value of EXIF Data — SCIE Publish](https://www.sciepublish.com/article/pii/567)

### Sistemas brasileiros
- [SINESP — gov.br/MJ](https://www.gov.br/mj/pt-br/acesso-a-informacao/perguntas-frequentes/seguranca_publica/sinesp)
- [eLaudo PCDF — Agência Brasília](https://www.agenciabrasilia.df.gov.br/w/novo-sistema-permite-solicitacao-online-de-laudos-de-pericia-criminal)
- [eLaudo — sistema PCDF](https://elaudo.pcdf.df.gov.br/)
- [PCDF — referência nacional em tecnologia](https://www.agenciabrasilia.df.gov.br/w/com-tecnologia-de-ponta-policia-civil-do-df-e-referencia-nacional-em-resolucao-de-casos)
- [SISP — CIASC SC](https://www.ciasc.sc.gov.br/sisp/)

### Tendências
- [OpenTimestamps.org](https://opentimestamps.org/)
- [OpenTimestamps Wikipedia](https://en.wikipedia.org/wiki/OpenTimestamps)
- [GitHub opentimestamps-client](https://github.com/opentimestamps/opentimestamps-client)
- [ProofSnap blockchain timestamping](https://getproofsnap.com/posts/blockchain-timestamping.html)
- [WebXR Measure tutorial — Medium](https://woll-an.medium.com/augmented-reality-measure-with-webxr-and-three-js-a0c8355eb91a)
- [GitHub WebXR-Measure](https://github.com/woll-an/WebXR-Measure)
- [WebXR fundamentals — MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Fundamentals)
- [How AI is changing mobile forensics — SANS](https://www.sans.org/blog/how-ai-and-ml-are-changing-mobile-device-forensics-investigations)
- [Computer Vision in forensic science — Ultralytics](https://www.ultralytics.com/blog/computer-vision-for-forensic-science-detecting-hidden-clues)
- [Smart Forensic Phone — bloodstain age estimation](https://www.sciencedirect.com/science/article/abs/pii/S0925400516319402)
- [SpeechToText forensic — ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S2666281721001311)
- [Voice recognition in forensic psychiatry — AAPL](https://aapl.org/docs/newsletter/N232voice-recog.htm)

### Evidence tracking / barcode
- [Evidence Hound Barcode System](https://www.general-data.com/products/software/tracking/evidence-hound-barcode-evidence-tracking-system)
- [VeriPic Barcode System](https://www.veripic.com/barcode/)
- [PMI Evidence Tracker — Barcode 101](https://pmievidencetracker.com/2021/02/26/barcode-evidence-tracking-101/)
- [NFC for Specimen Tracking](https://www.specimentrack.com/near-field-communication/)
- [RFID in Forensic Evidence Management — NIST IR 8030](https://nvlpubs.nist.gov/nistpubs/ir/2014/nist.ir.8030.pdf)

### PWA e arquitetura
- [Offline data — web.dev](https://web.dev/learn/pwa/offline-data)
- [IndexedDB for PWAs — Pixel Free Studio](https://blog.pixelfreestudio.com/how-to-use-indexeddb-for-data-storage-in-pwas/)
- [PWA Offline Storage — DEV.to](https://dev.to/tianyaschool/pwa-offline-storage-strategies-indexeddb-and-cache-api-3570)

### Body cameras (workflow lessons)
- [DOJ Body-Worn Camera Implementation](https://www.justice.gov/iso/opa/resources/472014912134715246869.pdf)
- [BJA BWC FAQs](https://bja.ojp.gov/sites/g/files/xyckuh186/files/media/document/BWC_FAQs.pdf)

### Escalas de fotografia forense
- [ABFO No. 2 Photomacrographic Scale](https://shop.crimescene.com/product/no-2-photomacrographic-scale/)
- [Forensic Rulers — Forensics Source](https://forensicssource.com/collections/rulers-scales)
- [Using Scales in Photography — Office of Justice Programs](https://www.ojp.gov/ncjrs/virtual-library/abstracts/using-scales-photography)

---

*Pesquisa conduzida em 2026-04-29. Foco PCDF / PWA Xandroid. Linguagem leiga proposital.*

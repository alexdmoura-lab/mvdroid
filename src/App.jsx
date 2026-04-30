// ╔══════════════════════════════════════════════════════════════╗
// ║                    Xandroid — PCDF / SCPe                     ║
// ║       App de documentação forense para cenas de crime         ║
// ║       Seção de Criminalística e Perícia — Polícia Civil DF    ║
// ╠══════════════════════════════════════════════════════════════╣
// ║  ⚠️  HISTÓRICO DE VERSÕES movido para CHANGELOG.md            ║
// ║                                                                ║
// ║  Versão atual: v210 — FIX DEFINITIVO da "tela em branco/azul"  ║
// ║                                                                ║
// ║  CAUSA REAL (que demorei 4 versões pra achar):                 ║
// ║  • Variável "ei" usada na label da Edificação não existia      ║
// ║    no escopo do .map() — devia ser "i"                         ║
// ║  • ReferenceError mata o render → ErrorBoundary captura        ║
// ║    → tela vazia                                                ║
// ║                                                                ║
// ║  Linha 2553 corrigida: ${ei+1} → ${i+1}                        ║
// ║                                                                ║
// ║  v207-v209 (descartadas — diagnóstico errado de cor de fundo)  ║
// ║                                                                ║
// ║  v205:                                                         ║
// ║  • Manifest, favicon e icons como arquivos físicos             ║
// ║  • Botão "Compartilhar DOCX" via WhatsApp/AirDrop nativo       ║
// ║  • Slots com miniatura do croqui + indicador de fotos          ║
// ║                                                                ║
// ║  v204:                                                         ║
// ║  • Topbar respeita notch/Dynamic Island do iPhone PWA          ║
// ║  • Sem flash branco ao abrir pelo atalho (PWA standalone)      ║
// ║  • Body fundo escuro fixo (#0a1420) já no HTML inicial         ║
// ║                                                                ║
// ║  v203:                                                         ║
// ║  • Layout Solicitação responsivo (Android-friendly)            ║
// ║  • Ano em select de 2 dígitos (24, 25, 26...)                  ║
// ║  • Dark mode: labels com mais contraste (t2 → d4d4d8)          ║
// ║  • Labels com peso 600 (mais legíveis)                         ║
// ║  • Ícone forca/enforcamento: laçada redonda c/ nó              ║
// ║                                                                ║
// ║  v202:                                                         ║
// ║  • PWA fix: tab bar respeita Dynamic Island/notch              ║
// ║  • Microfone APENAS em textareas (campos longos)               ║
// ║  • Botão de mic redesenhado (40×40 área, ícone visual menor)   ║
// ║  • Labels "Observações" identificam de qual seção pertencem    ║
// ║  • Imagens anatômicas como arquivos (/img/anatomy/*.jpg)       ║
// ║  • Service Worker registrado (PWA offline)                     ║
// ║                                                                ║
// ║  v201:                                                         ║
// ║  • RRV sem 2º perito · Campos extensíveis · Mic c/ scroll      ║
// ║  • DOCX blindado · Cômodo extra unificado                      ║
// ║                                                                ║
// ║  Versões anteriores (v115 → v200): ver CHANGELOG.md            ║
// ╚══════════════════════════════════════════════════════════════╝
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import html2pdf from "html2pdf.js";
import JSZip from "jszip"; // v241: reintroduzido — saveCroquiDocx ainda usa (migração para fflate fica para a v242)
import { zip as fflateZip, strToU8, unzipSync, strFromU8 } from "fflate";
import DOMPurify from "dompurify"; // v242: sanitização extra antes do dangerouslySetInnerHTML do pdf-preview
const APP_VERSION="v248-Xandroid";
// v221+: storage migrado para IndexedDB. Não há mais cap de tamanho — o app
// usa a quota real do dispositivo, lida em runtime via navigator.storage.estimate().
// O valor abaixo é apenas um PLACEHOLDER inicial para o medidor de UI antes da
// primeira chamada do estimate() retornar (acontece em poucos ms após o load).
const QUOTA_PLACEHOLDER_KB=1024000;

// ════════════════════════════════════════════════════════════════
// LOGOS INSTITUCIONAIS — base64 JPEG
// ════════════════════════════════════════════════════════════════
const LOGO_PCDF_B64="/9j/4AAQSkZJRgABAQAAkACQAAD/4QCARXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAACQAAAAAQAAAJAAAAABAAKgAgAEAAAAAQAAAGygAwAEAAAAAQAAAI4AAAAA/+0AOFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAAAAOEJJTQQlAAAAAAAQ1B2M2Y8AsgTpgAmY7PhCfv/AABEIAI4AbAMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2wBDAAICAgICAgMCAgMFAwMDBQYFBQUFBggGBgYGBggKCAgICAgICgoKCgoKCgoMDAwMDAwODg4ODg8PDw8PDw8PDw//2wBDAQICAgQEBAcEBAcQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/3QAEAAf/2gAMAwEAAhEDEQA/AP38oorx34u/EqPwRpX2DTnDazfKREOvkp0MrD9FB6n2BrhzHMaWFoyr1naK/q3qzfDYedWapwWrF8V/Gvwt4S8Qf2BdRTXTRL+/kg2sInPRCCRk45ODx05OQLdn8bPhteKD/a3kMf4ZYZVI/HaR+tfAMssk8rzTOZJJCWZmOSxPJJJ6k1x3iHx74L8JyJb+I9btLC4l/wBXBJMonk/3IgfMc+yqa/F4eJOYSqy9nBNN6Kzdl8mj7SXDeHUFzNp97n6cXHxj+G1uhd9bjb2SOVz/AOOoa888QftHaBao0XhywmvpegebEUX1xyx+mF+tfnOPieL7/kWvCuu6yvZ1shYIfcNqT2mR7rkHtml/4SH4r3fzWHg2xtlPbUNYMTj6i2tLpc/8C/GrxfHmazjyxUYfcn/5M3+QqWQ4WLu7y/L8EfRPiT4keMfFGoR6hf6g8JgbfDHATFHE3qoBzn/aJJ969P8ACv7Q/iDTES08S2y6rEvHmqRFOB78bW/IH1NfEzXnxl2mR9M8PwqBk5v7pwAP9r7Kn8q5LwR8Rfih450FPE2h+G9Jn06aSRIXm1K7s2mSNtvmxo9hISjEHYSV3Dnpgn5zB5nmVGcsTSra31bkmn2vfTpp+B6VbC4acVTlDTpofrfpvx6+HV+gNzdTWDH+GeFj+se8frWlP8a/hnAu7+2A59EhmJ/9AxX5Wf8ACZePbP8A5CngK7mHdtNvrO4A98XElqxH0Un2pP8Ahb3hK048Rxah4dI+82pWFxbwL9bnYbf8pTX08PEDNeWypwk/LX8pHly4fwt78zX4fmj9JNT/AGjfCFqCumWd1euOhKrEh/Ekt/47XsvhnxJpnizRbfXNJk3wTjkH7yOPvIw7EH/EcYNflho2vaH4is11Hw/qNtqdq3Sa1mSaM/RkJH617R8LPiLceA9axcFpNJvCFuYxzt7CRR/eXv6jj0xtkniJiPrShj7cj02tyvv3t3IxvDtP2V6G6/E/QaioLW6t722ivLSRZoJ1Do6nKsrDIIPoRU9ftCaauj4to//Q/crx14007wNoMur3xDyn5IIc4aWQjgfQdWPYe+BX5365repeI9VuNZ1aUzXNy25j2HooHYAcAeldX8V/F2q674nv7nxD/oMOmNJEsLsAlvHGTuJPTJxlm6H6AV80x+L/ABJ44/c/DG0RdOfg67fowsyPW0gBSS6Po+Y4T1WR8ba/nzi7PquZV3Tp6UoPrpr3fn2W9ul7n6DlOChhafNL4n/VkY+kaRqHxJn1e/8AEetX0WmWmpXtjDp1jMbKEpZzNDulmh23Ls+3JHmhOcbPX5T8Q/tUeGvhjceLbD4Q/CmS5tPCF2bPWdR/d2cMcwmMAZ2iSV5PMkUhWdgx6kda+tfgdFdweFNVt7+6e+uIfEGvRPcSKiPMYtRnj3ssYVAW25IUAZ6ACvz9+DXwQ0r41fFX4z2XifWtRtdAsfE0j3Om2cvkw37/AGu6ZPPOCSsZXgDB+YkEEA0spo4bmxDxetOnbRXS+K2ytd9r9dx4udW1P2PxSvrp2v1v/Wx7d4v+N3xJ+L3jXwl8K/gjqEXhWXXNCg1/UdQnjE8ttDcxiRIUVlIyFZckDJLDBUAk+C6x8XPjBF8IPjh8OPHevyX2ueB7jTUttUtz5ExSTUY4ZBviCHawAK5+bDMpOMAew/G34feNvhR8YtL+NHwiv9A0+H+y49LlsdYuo7OBI4UESBRJJEDGEVMBXDBl6EHFcNo3wsttY+E/xC03X/EEuseOPiXd2t1eXml6TqOo2UC290tyI0e3typyd+SCq8qBkLk+3gPqcKVKpCMeS8HteSkp3ld2vZR07Pocdf2znKLbv73WytbS2u9z698G317P+yfpmpTXEkl2/g9ZWmZyZDJ9hzvLE53Z5znOa/PGx+I3xGT9mz4Z+CvDmvXWnX/jjxBe2U+oiaTz0jSdEVPNB3hS0oLYIJC4zgkH2r4dfCj4oeF0Sw1fxf4r1rQotNutNj0saTPFaKk9s9vGdk90gxDuDKpTnaBkdRNJ8B7EfArTPhVeReIYNY8P38upadrEejSZinkcttMUEsz7SDg7WyCFYdMHLBvCYepJSmppzUtnppNbNfZbT/Iqt7WpFNJq0bb+n56nqWgeA/jx8DdL8b3E/jdvFXhS18P3l3Yz6g7Saha6jDCzqUWQSqYwVOVZ9vI+Xg7rfw6/aJ1iy/ZOHxz+IRTVdTthcqUQJbC5lW6a3gT5FKruO0EhTgZOK8S0DRviAtx4y8TfGf4jvPqGp+HbzR7K0ubO90a0laSJ1iac3dtaQDYXbBweXLF+OfLNc8A/FjVP2ePhl8GvDWh/2wZNWvbnUZbOeK6skPnv9mSW5tneNUdZWcksAML34EvLKNdqOJlFyc43kly+6oyct0uyu1bW3Uf1mcLuknazsr31urd/+GPvH4Tap8K/2j/CK/Emz8NjSNS+0S2txJC5tr+GaLDFftdqYpcEMrD5h15FehaOuteFPiBp3g+TW7vWdL1XTNQvEF95ck1s9jNZxhVmREd0cXJz5pdgVHzYOK+SP2SNe8TeH/jR8TPhv430VfDWp6s6a8mnJIskULu2J/KZCVZX82MrgnAXHY19O+PbDxDqPxf8FweGNVGkXyaNr8ivJAtxDKFn0z91NGSrGNs5PlujggENjIPzuZ4P2eMlh1L924txu+ZJOPMrPXba63sehhq96Cqte9ez6dbH6BfBD4n/ANi3KeENelxp9w2LaRjxDIx+6T2Rj+R9iSPsuvxf03x3dWWpW/hz4gaadA1W6cRW8ysZtOvXPQW9ztXDt2imWOQ87VcDdX6SfCXxf4z1bwdC8+mHURbSNAlw0wjZ0QDGdwO4jON3fHPOTX23BPE86MHg8Wm0leLSvptbS912fy7HiZ1lkZv29F779D//0f0w/aR8JW8OrW3iAQq9vq0bQXKlQVaRBj5geDvQ4x/smvh/w0t78O/FWneBIJftnhvWVnOmxuxM+nPbp5jwAnO+1K/6vJ3RHCDchUJ+pnx00tdR+HV9NjL2MkVwn1DBG/8AHXNfkx4r8Y+H/Dvxd0ebXLgqdO0S88m2iRprm5uNQuIFiWCGMNJI+21l4UHAJJwASPwfi/LXSzOpCC92pHmt52evrzL8ex9zleIU8JFy3i7f18jwzSv2ivDXgW58Q/D+x+yyeI4fEWvST/2neRaXY2yz6ncSRtJNN88hZGVgsEchIPJWvTPhfoGo/EfwmnirxFrbWttqV1fE2Ph5v7NsZfKupYRN58GLuQyhN5bzwG3fdrur3R/GHxOj2eLVbwz4cfppsDq2o3KntdXMZKwA947di3rPjKVa8YeKfC3wb8FwxWFtBaRwp5Gn2MQEaswHQKOirnLt/wCzEZ+cxuMpW5aEbVG7t3v36279tl1Z7+TZVicXXhh6cXJy0iu7e39P8EdDoHw98D+F5jd6DodpaXT8vcrErXLn1edsyOfdmJrnvEfxi8D+HbptPN0+o3kZCvDZqJTHkhfnclY1+YgEFsgnpX59P4m8Ual4ruPFWq3d1KJvkuJLeQxF4ZuGh3gMIwQCFXBGMYBwQftXQfCF5e6XcW1hpsPhzwsrymCKW1W61G4tCXfEkc4lVC5YN8wkYGKEY/dBm5XhYP8AeYipc/oPG+EeAyKKrZ9ifdvblhZNtJcy+0+q5fd96L5m4q18XxH4o+I/i3xH4ZsPDehT2EtrqEM0tt9ujSWeNmCiKaNWBiUhsnzBgKdx+XJPZaH8btE1DTxqes6VfaRa+c9u08kXmwCVFLMuY8vwAckoAMcmm6n8Bp/HdrZ6vpHjC30iDSRJeXkGsXV21xItxJukM6sVSOORshvK4ZicndwLR+HtpbXEn/CGTyWNxp05k8q6WSeyuTLjzVDzqJwkygo5RlO1m+TLHPmYbO8qxVWWGoyfNDSWjVvW6Sfdau6PHnmXB2JpwoOnOHZpv3dX8V3JO+j91O2vy9V0/UdP1azj1DS7mO7tphlJYmDow9iMiuP1j4X+ANcuzqV5okEOon/l9tN1nej6XNuY5h+D18ffE7UdS8I2q6fohn8NatqcUi6tawsy27+WUKSRcFSr4cCRHLFAEkBcSPL3/wAAfjFfXZg8G+M7hnmm4s55Wy24/wDLF2JJOf4CSTn5cn5RXdUws6N5Up/d6XJz7wYxlHATzTBzVailzab8l2nJpXWjT66x95aKSVX4jo3wb8deHfFVvqOl38l3DeRLc+Jnit540hEeLeLU40WXDq7ECcT8rx1yNj4bfGTw58Y/jL4fl0GGSG80HRdaTUId8dxFE1zNp3lFLiBnhkV/LfBVt3y/MqnivonxV4O8P+M7KOz1628w27+bbzRu0VxbSgYEkMyEPG+OMqRkZByCQeWi17xx8PwIvE8UvivQE4Go2kI/tG2Qf8/VrEAJ1HeS3UN6w4y9ehQxtOrSScb1Umr3tvfys9Hto77X2PwmvQnFu3w7lfwhp978UNZtfHGu4lgt7qaHRdMXJjtnila3NxNnG+6YqwHG2FTtTLFnb9lPDGhW/hnw/YaFbAbLOJUJH8T9Xb/gTEn8a/Kz9j6fRvFfi6az0W7i1DT9P8SancRzQsHjKzsdUXBHHBuAMdunGK/XCv1Dw/wHLKvXktnyryS1/G6v5nzGfV/dp012u/XY/9L9vvikVHw917f0+yv+fGP1r82DpunHUBq5tYjfCLyRcbF83ys7tm/G7bnnbnGea/QT466mun/Dm9hzh76SGBfqXDn/AMdQ18EV+FeJ9dPHQgukdfm2fd8MQ/cSb7/ogrz/AOIfjK18DaZZ6vNbLdSS3MdugJCkK2WlIZsAYRCeSASB7CvQK+TP2i7uZtX061jLhbSymnYqcAB5FXcflO0AqDnPJxja4j3fB5Zh1VrRhLY6+IMfLDYSdWO+n4v9Fqe0fDTw9pVp4ShvV02G1l1qQ6hNGFJAaVzJEP3gziNdoUYGMZABro7XxVbai86aXaXF2IJpbdnRVEfmQsUcbiwGAQf8KZprtZeEdMt7MeVM1rbwQqVwVZkCglDn7g+YjnABrL8FwRaXHJZwDZb3FzfhBnpJDdSrjJ6lkxgeiE+tZ1oc3PO/XQ9X6xWq8sq03KTWrerb0PTdOk0wWFxHqbXizXjNCBAYFEDrYX85kj3kmU+RDPG2/wAtcyIAu8hxz13qQsiVaKa5xzmGFydvqwIwGPXajPjpuJrzz4sXF3pHhqXxMi7YdPvdLiLZwXFzLL5ij0wkfOf7w969D1aR/sy2kLFJbxhCpBwVDAl2B7FUDEe4FebRowlrTrzk4tqSlJON+WMtFb3bKVmo2Ttd3dzzMJV/2itTvqrP77/5Mo6bc6F4ss7bXIIEuURplheWNS6EExSAZyVJwVYcHse4r548IWHg7QPiJqHgG+8P2sxu725limmjWXyl8tJbeNBICyrsEnP3d2MNk7R7Z4LRLJbm1jUJFd3N9MgAwA0d1Ijj2G3ZgfWvm34nztp/xee/gV1+zPp9w5HyrwyLk/K3B2gBh3GNpcR5+iwGHUqk6Xk7DzfiHF4LDx9jVcYyklJJ6SSvK1vy7XZ9nUUUV4h656x+z9a6fp/xKtxaW8du14LmSTy0CeZKYjl2wBuYheSeeK/QCvzZ+HmrjQ/G+i6m52pHcorn0ST925/BWNfpNX7t4YYlSwVSn1UvzS/yZ8LxRTtWjLuv1P/T/UD9pLX/ADtS0vw1E3y20bXMoH9+Q7UB9wFJ/wCBV8x16H8V9QfU/iHrk7nPl3BgHsIAI/8A2WvPK/l7inHPEZhWqPu0vRaL8j9RyugqeHhHy/PUK+Tf2iLVxr2jXDNsiuLaWIssfnOnlsHZ0QkYKg53IcjHzjbgj6yr5W+OnjDwzqVonh2/gvbK+s5xPbyXFo6W82zKkBsrJtP9+P5h29+PKKnJXUnsVmPDeNzWhPCZfRlUq6NRim27NNpW11Wh638Nbuy8T+CtBu7qHe+lERvbpLPAqyQq0JiZ42R+EbGQcbucEDFei3Wl+GzcWsui6O2kLaySTY/tC7u98kocMSJmCAHexPykliDkYIPy38B/F/hzS9PvotX1u0s1uJY4ra2luAGHlJullIfaQJZHYgsFJxgAYAH2x8K7HwP48v0vNV8UaVb6LAQ0qm/gWe4H/PNU370Q9GcgHHCZJ3LhW4Y+s5iqkZSVuvPKMEn/ADK6i7Xe6fl0OWjTr4TC03mNKUKiVmpJptxfK7JpPVrsvOxkS6v+zFN4Zfwd8aJo9Qu7qWO9uLX+1JbRIVK/6NvWOeE8xlJAcf8ALXGTisc22iJqUN5pjJq+n2pJtXMshS5s5lV4mMiMGJePY24E4b+8Mg+F/HaG0k+NXxUmsdAur/T9RgtvLmtI3lg1G2WOz2WkDxxssW11E3moW4iKYwxNfUXh1PhVN8DfAkF94y0Tw34y0fRLOG50/UtStrWZkEYdYp0kdXjkUNlGKjIOGGCrJ9PV4dqY1Y3AxpqMKbXK0lDnTVn70bNyas73b0Wqd0vzvIuKU8fU+sWSd03rfSTSvdetrd3pazfK6hDo11c20ul6PHo8NqzyLFFPLPulkyGdmfaP4m4C9SWJJxj4L8SX/wDwlfxMe7syrLfajDbxuYmCFI2VFdZCdysdpRlQbm8v5SMkj6t8U+OPBn9lX+kf8JNYW13dxyWsckd3FIqSyoVVxJCzLtB/5aKSvH3q+PPAHifwvo/i618T+IpmM0G4rDaxtO73EqhXYs2I0VnLOBFkndgnaAo8Lh3K45fSnTSa5dEpNt666uTbevnofe5lwpmuayoUcsw06kPicoRbSS0bbStZJvfd6I/QqiqGl6lBq9hDqNsksccwyFnhkgkHb5o5VVh+I56jir9eU007M99pp2YdORX6Y+CtZPiDwnpOssdz3NvGZD/00A2v/wCPA1+Z1fd3wBvGufh3BCxyLS4niH0LeZ/7PX6L4bZiqOJqQls43+aat+bPm+JMNz0otbpn/9T7S8fo0fjrxCrdf7Quj+BlYivn63+LfhxfEeo+HNahn0f7DeiwjvLpQtnPcGOOURrOCVSRlkQqkmwuCNm7kD6g+MVg2n/EfWYyMLNIky+4lRWP6k18yeHbKxk+IXj7wvqdvHdWWrW+manJDMiyRSi4iksZFZWBDDbZKCCOhGa/l7F4aEcViYVV8Lf/AKVb9T9PhWl7GnKHW35Hp1eC/FP4R+IfiLei6TxElva2yj7NZNbt5avjDM8gk5Zjn5tnA4A6k+OaZ8cPDWkag1p8E21bxPp0Ijkm0OeyudsEMgBWS0uZVEkKFTlI5A8RGAhiHNfXvh/XLTxf4W03xJpTS29trdlDdwMwUSpHcxiRCR867gGHHzDPqK5cXgK2FfM1o+6s/mt1/Vmz6DhninEYDFQxuBly1I7Oylb05k1+p8J/D/wj4i8G+MNR0PxD4Ni8X2l/Dc2zyROrhBGwMrwysNqTKF2qGAdSVHU4PvfhrXDbXFxp3g7Wkvo9MaNV0rxD/ot5GSkKlbebmRSZXdFRkcRpHuaQZGfP/GOnfGX4e+PINT8L36a3ceJJgBHsSMXHkIMiWBdqBggA8xSOMklele1S6v8ADLxtZ2tn48jsrfWVgiM9tfI1pcQyMuXSMziOXaGJ+6efxr0amIUqS9pTUoPt/X5n7/nfElXE4ejXzOksTQnFe9DmvFqyldSSs07q8XG7v71vdSeIPin411HR7DQbiXWtBu9Tv7aOyksJrS8kuZJ1dTbm6a8i8tJGZctJG+GVgSCjLXO3Ut3btJr7Jo+g313Ck8uq6vdi+1CUvE/kkMwWPcxi2f60qpOdu1Wx6No/wT+CF5o2sS6ml2syQpLo6wXly8P2pmxIwIdgCRsJJI4XPauct/C3wP8AA0huGi021mh5zdTiaRSOflEzuwb/AHRn0ronXpUsPThFNxd2o8zdrO2q2W2iWlvM/OcNHguOIdfCYGrOt2lFct+nL+8l0et4yu97rQ8B+JNvDqmgT6h4T0C/8TrfTxxHXdSWRZ5mJcxm3tk2lFUFkOD5L/JlBIoIg+GXwD8Zz21l4nXXoNGmidnt2h/0qWNkYqVO0onBBUgMwxwc811nxZ8R/FHxLrlpoHhZWs/DGrTx2MUxV7aSeWRfnD7wJRGpDZwoUqp+9jFfRXgHwzq3hPw9baPq+rHU3t4440AhihihSNdoSMIqsRjqzkk4zxyK4cfiZqK5oqLfS3T+u5+gZ/x/m+ByqlCFSFL2vMlTs5SVNpLVSjyJNpppJL+WMUkjr7VblbWFb11kuAiiRkUqjPj5iqkkgE9AScetcz4n8a6D4T8i31CR7jUL3ItbC1Qz3lyR18qFfmIH8TnCJ1dlHNeJ/Fn40ax4Y1u88OaTp9zZ6dpkUUmp63HFDc/ZBMNyJFBJKilyvPmSZVDj93JnFb3wr8ZfC9/C3iTxj4Tt783emWwudSvNXhkTULlBCZ43eSUZaMqCUCYjUfcVVxWFLKp+zVaaun0Xntd9N/X0umfzRWxyUuSO/wDW3c9P8D+Kf+Ez8M2viM2Mmmm5edDbysjuhgmeE5aMshzsyCpIweCetfoX+zshXwFMT0a+lI/74jH9K/Ob4YaTPoXw48L6Tdc3Ntptos5PVpvKUyMfcvkn61+m/wADrE2Xw301nGGuWmmI/wB6RgPzUA19LwbgVWzCrCnsk7enMjgzivyYeEpb3X5M/9X9Dv20JdV8HaRb/EHQ9Kl1ad41tDHEruEff8ssqxK8hjRWZnEaO+1DtUmvlb4c6XoMOg3Xi/T9Zi8T6lrKb7zVY2UrMYg22KJVJEUMJLBIQflJJYtIzs36y+P/AApF4z8K3uhtgTOu+Bj/AAzJyh+h6H2Jr8l/Ffwxtf7Sv9V0W4n8K+IjvS5uLQKBOyZUrd27AxT46ZdfMUcI6da/D+O8vjh8W57Rqa381a6fW3XTvs7K32uS1pVaKindx6fr+hxfgv4feD/Gnwm8Bt4j02O4ubTRNN+z3SFobuA/ZozmG4iKyx/8BYZ710ui+EfFfgXR7HQfCGpQanpOlwR21taamhjlSGFQkca3cA4VVAA3wSOe7E1q/CyLyPhj4Qg6+Xo+nr+Vugry79qn4t6p8GfhBf8AifQAo1e8misLOR1DLFLOGJkKnglERioPG7GQRkV8XD29fFfVabvzSsk9t/w+R70uSnS9rLSyO+1XVzfWpsfHHgy6kt1OWkhSLUYA3TdGIm+05HZvIUiuT1vUPBWpQ+Te+K7zTIw0bCDXInMQ8uVJgGGqRCTaXjXI8wAjK/dJFfHXhn4bftmaf4K8P/Frwp4/ufEes6usF3JoN7MGt1trhfMXL3MoiJ2kb1VYyuTtYkV7B41+P/xJ0X9pHwB8JrG1tbSy1+xsZtUt5k86WCaZ5jOiSo4HyIgAPIzzyK9tZRKE3DC1VKyk3yyaty73Uk36PZnVlXFmMwTjUozlT1Vu13s97fhc7NdL+Fau0h8UeCZSTGQZLO34McRjzhL1FO84dwQQWHQKSpv2Fl8LoCijxro4VFiXydIjso2fynEg3Lm4kOWGSFI3ZKnKkrWB8D/2hPFfjP4o+OPhR8S7Cx0rVfCu6SF7QSRpNBDIUlkbzZH4IaJ1wR8rEmvDrb9q/wCMvi34UfE34o+H7LS7HSfCt3bW+lyC2leWZZrlUfzTJMyFo4HRmwi8tnGOK1WXY2c3SeluXXmVvf8Ahs1HW59HV8WM4cLvFPW+0Un7u+1rW/M+09M1rwhYz/atA0fVdW1BgQJ3sbtpXDHJC3d6qRhSSTjzQuSeK3jqPxC1b5dO0m20KJv+WuozfaZ1/wC3a1by2B9ftQ+lfnJ8Zvjx8XF+Bnwj+L+h67NZjU5Z4tWS2Cwx3FzBJ8gO0ZCt5MoKg4I7V+pWl6ja6xptpq1i/mW17DHPE395JFDKfxBryM1y2phoRrTSfM5LVttOLs77L00Z8pHM54qpJ1Jtuyd31uvmzzjTvhB4Uj8RTeMvEaHxDr07pL9ovApiheNFRDBbgCKMqFAV9pkx1c0zwbbwXPxV+JNldRrNBPBo++NwGV1eCZGDA8EEDBB616xXgz+ArfxP8TvFlxqWp3kemzQabHcafbyeRFdGNJSpmkTErINxHlq6o3IcOMAcOFxLmqntZfZ+73o6Jf8ADInEUdIqC6/oy34Hvv7K8f8A/CtfA8z+JPDp3qDFulGiTrjbZtcH93JG5OI4t5mhOFIMRUx/td4f0pNC0LT9GjwRZQRw5HcooBP4nmvij9nT4c2MusW95Z2MVlovh4L5MMMaxwiX/lmiKoCgJ97joQPWvu+v2Hw9wH7ueNcbc+i7tLd/N/l1er+P4gr2caF721+/p8v1P//W/fyvlT4+fDNrlZfGujRE5XF9Gg5xjAmA9hw34H1NfVdNZVdSjgMrDBB5BBryM8yalj8PLD1fk+z6P+uh2YHGyoVFUj/w5+L2naF438H6fa6VoF3a67ptjEkMMF/m0uUjjUKo+0wI8b4AAANupPd+9eWfHXw1pHxk+Hl34E8a6bqvhqVpEuLW7W0N/FFcRZCyE2TTKI8FlbzDGdpJ4OK/TL4q/BO502WbxD4OgM1k2XmtUGXh7kxjqU9hyvuOnzXX895hh8VluKXto2mndSWl/NdH93qfoWHqUsTS9x3T3X9a/ifmd4D8C/tJ6zqfhfwenxg0SPw/4SkiEbaTcrJevBEvlpHJD5SlyI/l2zZUdWDkV3us/Cj4hat+3HpPxLuNGk/4RLTrbYl9vjKFlsZFA2ht4/fPjlR+XNfb2raBoWvxC313TbbUYh0S5hSZfycEV5p4z8N/DfwJ4R1rxjJoYtbTRLOe9lj0wtZyMkCF2CCF4l3EDjJHPU11Q4jlUqPlgk5RlCyivtbu6cdfXQyeXKMVdt2aerfT79D42/a1+FfxO0z4pWfxY+DWj3Op3ev6Vd6VqaWkTSspeA24lcLzkxSDYegaJSff1rwv8CNS0L9ji++FsFkW8Q6rpFxdTQHarvqM6+ckTFiFDIwSLJIHyjJ71yGg/tHfBzVrS4uL/SvGWiEaXc6tZLe6lfxrqNvaIzyi1YXxV2CoxGSF4PORivSPg/4y8E/Gacmz8IeJrTTmtTdRXutXVxNaTrvVAiFrqYFjkkDGMKa9TGV8bTwtOnUg0qTTvZa2vyp+9rbVafoctGnRlVlKLu5X09d+nU8Rh/Z88bah+xxbfCbxubHw34g0zUjd2Z1C7jFvGpnLsXlhMgH7uWXgZOfrTPhx8JfGml3/AIbvdb+Mup+JLTw29obfSvD1vdXtgyWhXZDJNG3kBSq7D5ijjPIr770/wD4F0q4F3pnh3TrW4H/LWK0iWT67wu7P411teTV4srOM4raUnLZaOW9r8zS+dzrjlULxfZJbvp6WOB/tXx9q3y6XosOiRNx52pzLNMvuLa1ZkcfW5Q+1d38MPhjrmteI7iCK9k1PU9WMbXVw8aRQQRQjaNiIMqi7jjczuScbjxXXeEvBev8AjTUBYaJblwCPMlbiKIert/IDk9hX3r4D8B6T4C0cafYDzbiXDXFwRhpXH8lH8K9vqST3cK8MVcwnzSjy0er7+Sb19ei9TDNczhh1ZO8+nl5s2PC/hrTfCWiW2haUuIYByx+9I5+87e5P5dBwK6Ciiv6Bo0YU4KnBWS0SPz6c3JuUnqz/1/38ooooAK8k8a/Brwp4weS9jQ6ZqL5JngA2ufWSPgN9Rgn1r1uiuLH5dQxVP2WIgpLz/rT5G1DETpS5qbsz4K8R/A3x3oTM9pbDVbcdHtjlse8Zw2foD9a+cvi14C17xN8PfE3glom0271vT7qyje6jdFR542QFhjOATzgZr9gqY8aSoY5FDq3BBGQR7ivgMR4Z4f2iqYaq4tO6uuZfo/zPoafE1Tl5asU/w/zP5jtO/Y3+Jd/ptpZeM/FOmzr4c0DUNG0WK0hlVFe/ikiMlw7AMQolJ+UHOB0wc/UfwC+BHhz4L+FbOytLG2/4SKa2jg1K9tvMIunjJIOHPv6Cv1l8YfA3wv4m1C31Cx/4lLeYDcrAoCyp3wvRX/2gMeoJr0nQfCPhvwxbpb6Hp8NtsGN4UGRvdnOWJ+prkrcKZti5ToYiso077pb7vZW6tt369zWGbYSklUpwbl59Pn/l0PgHQ/hx438Quo03SJzG3/LSVfKjx6732g/hmvoDwn+zlawMl34xvftLDn7NbEqn0aQ4Y/RQPrX1DRXsZX4dYGg1Kreo/Pb7l+tzjxXEdeorQ91eW/3mfpek6botlHp2k20dpbR/djjUKPr7k9yeTWhRRX3sIKKUYqyR4EpNu7CiiiqEf//Z";
const LOGO_DF_B64="/9j/4AAQSkZJRgABAQAAkACQAAD/4QCARXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAACQAAAAAQAAAJAAAAABAAKgAgAEAAAAAQAAAHigAwAEAAAAAQAAAI4AAAAA/+0AOFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAAAAOEJJTQQlAAAAAAAQ1B2M2Y8AsgTpgAmY7PhCfv/AABEIAI4AeAMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2wBDAAICAgICAgMCAgMFAwMDBQYFBQUFBggGBgYGBggKCAgICAgICgoKCgoKCgoMDAwMDAwODg4ODg8PDw8PDw8PDw//2wBDAQICAgQEBAcEBAcQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/3QAEAAj/2gAMAwEAAhEDEQA/AP38ooooAKKKKACiiigAr5jb4ryL+16nwgMuLF/CDX45+U363ozFjrvFufM/3a+nK/IbxHrn9mftz+FPG5lONS12+tiOwjEKaIF+mE8zHqc9a8nM81hhqmHpy3qz5V/4DKX/ALaRXqKnSlVey5f/ACacYL8ZH680UUV6xYUUUUAFFFFABRRRQB//0P38ooooAKKKKACiiigCC6ubeytpry7kEUECNJI7cBUUZJPsAK/AX41+J7/Sdb8BfEAxMt9Fbtrpi/iEzXUd6U9M7jt9K/an46XTW/wi8UxRuY3v7J7BWBwVN8RbAg+o8zIr8a/2qI0TxR4diVQEFjcKFA4A8xBivxXj7OeXiXJ8FF/8/pv5QaX5yODjDmo8LZhjFvH2VvlVi/0R+8lpdW99aw3tpIJYLhFkjdejI4ypHsQasV4X+zLrp8R/AHwJqLP5jppUFq7E5Je0H2ds++Y+a90r9pjK6ujro1Y1IKcdmr/eFFFFM0CiiigAooooA//R/fyiiigAooooAKKKKAPm39pTV5o9F8M+FbcBv7c1eNrgd1trCKS73/T7RHAh/wB+vyo/aq/5Gzw9/wBeVx/6NSv0o+OOope/E/T9LU5bSNHaVvb+0bjAH1/0T+Vfmv8AtVf8jZ4e/wCvK4/9GpX8gcSZ19a8TqFBbUabj83TlN/+lW+R1eJGF9nwBjJ/zOL/APKkF+h97f8ABPTxbJrPwZ1LwrcEb/DGr3EMQ7m2vFW7Vj/22lmUf7tfedfkR/wTn8TJafEHxX4PkfB1TTIr2MZ6mym8tvxxcj9a/Xev6yy+pzUYs+G4BzD61k+Gqvflt/4D7v6BRRRXafXhRRRQAUUUUAf/0v38ooooAKKKKACiiuO+IXih/BfgjW/FMMQnn061lkgiY4Es+MQxk9t8hVfxqKlSMIucnZLccYtuyPifUrk6x438X+JmkMn9papLHGDyI4bBFskRf9kmBpMf3pGr4f8A2qv+Rs8Pf9eVx/6NSvsvQdMfRtFsdLlna6ltYUSSZ/vTSAfPI3+07ZY+5r40/aq/5Gzw9/15XH/o1K/zh8OM9eZ8evMG/wCJKrJejjKy+Ssj7Dxywiw/A+Jor7Maa/8AJ4XOP/Zq8Tnwf8ffA2uGUxRNqAsphnAeO/RrXa3qA0iuB6qK/oZr+XVmuUHmWczW9wmGilX70ci8o6+6sAR7iv6Tfhb41j+I3w58N+OY1WNtasYLmRF5EcroPNQf7j7l/Cv9BMiq3hKHY/mDwQzT2mCrYST1hK69JL/NP7zvaKKK90/bgooooAKKKKAP/9P9/KKKKACiiigAryL4kaePGeteH/hzIN2nXcr6nqoDPGWs7DBijV0IZWe7eFuCMpHIK9dr82v2m/jfrvgHQb7xDplnJe3fjm7fTdNeGc24ttI0aVBMS6kMXuppJSGQj90yc5WuXHTjGjOU48ys9NNfLXTXbXQzrYulQi61aahFbt6JeZpaD8QvhHqnjmXRLzRGttCRrthd/b9U877PD5vkT+WxG9J/KbbsJ9OTXkmpeJvhT4rm0+48VfDaK61IRRubOW61h7yGCV1EmFK8hTnJ+6SMZr4x1j4wf2499dXfge2iu/sVhZ6fJG8JazFlPLLujZwSpIl424wVFYZ+K3io+Kx4s+x3n2wWf2PzvtcP2jy95k2ebs/1eTnZt6857V/MFNZ9Fxq4TA06M4uTuo0btOzULqOkVdxb0k7bvc9bE8bcK1oOjicfGpBpKzk2tOrTeruk7bH6Ba9pv7LWl+Ok0S18BWlxoWbV2vPtWp+d9nm8vz5/KUnYkHmru3kV93/CvQbP4dahrfwr0yEW2jac0eoaPGGd/Lsr3PmwlnLMzR3STNyeEkjHavwo0b4wHQ3s7u28D2st2bLUbPUJJHh3Xi3txFMGkZQCxAiw27OSxxX6MfsyfHDW/Hug2Ov6nZyWN34Fuk0/Unmn+0i50fWZXERDsSwe1mjhYs5P7pHGcvx+u8D53meIxFeGY4f2aveDvHbZx93XpzJu7tJpvRI+fp43hxzhDKK9OVRrVRsm+t/0fofpNRRRX6YdwUUUUAFFFFAH/9T9/KKKKACiio5ZYoInnncRxxgszMcKqjkkk8AAUAeYfFjxTHouj2Xhmzv2sNb8YXSaTp8kYzLG8/8ArZ04IBgiDOGYbd4RTksAfgD/AIKGaTp2g6P8M9E0iBbax0+LUYIIlzhIo1tFVRnJ4A7nNfWWpfaPFeo6B8TrvAtb/WdPtdGjAIKacJS5nbP8d24WTjgRLCMBgxPy9/wUj+58P/8AuKf+2tcOY/wJnxniL/yJMT/h/VH5cV1f/CP6f/whv/CS/wBof6V9r+zfZvLbGNu7O/pnHOMYx3zxXMxwTzZ8mNpMddoJx+VfT4uvBX/Cif8AhGf9H/4SHyftnk7R5/meft3Zxnf5fbOdnOMV+McXZ7UwX1ZUoylz1YxfLZ2i73crp2j3enqj+Z+B+G6WYfXHXlGPJRnKPM2ryVrKNmryfRa+jPluv0z/AOCeeladrumfEvRNXgW6sb+DT4J4mztkilF0rqcYPIJHHNfmjJBPDjzo2jz03AjP51+n3/BN373xA+ml/wA7qv0TJZJ1k15nqeEMWs7gn/LL8j7y+FHiePV9HvfC95ftf614PuX0m/kkGJZGhA8md+AGM0RV2ZRt3l1GCpA9Tr5jsftHhXUte+Jtng21hq9/a6xFtJL6aXVxOu3nfaOWk5yDE0wxuKkfTEM0VxEk8DrJFIoZWUgqykZBBHBBHQ19if1w0SUUUUCCiiigD//V/fyiiigAryHW5T8TNXn8HWDBvDOnybdZn2krdyIc/wBnxMcKVyP9JYbgF/c/eZzGXev6l8SHfRvAty1roPKXmtx5HmYba8Gnt0dzghrgZSPom58+X6Zo+j6ZoGmW+j6Pbra2dquyONc4A6nk5JJJJJJJJJJJJoGcH8SwFi8LKvAGvaeAB/vNXxR+39rbeHNY+G2srbRXhtzqx8qZdyNuW2XkeozkHsRX2x8Tf9X4X/7D+n/+hNXwX/wUj+58P/8AuKf+2teXneGhWwlWjUV4yTTXk9GfJ8c4qpQymvXpO0opNPs000fIngv9oGXwppstg3h20PmSF91oPswOQB8ygNk+h44rH/4QfWza/wDC3/Ok/sn/AI/s+efte/z/AC/K8zGd3ffjGPfivC697Hi/xJ/woc6Nst/sP237J5m5fM8r/Xbdu772/wBs7e38VfzvnnDFPLa0MRlEIwlXqQhVbb1g73td6PtY/DuHeMKmbUKmGzypKcMNSnOioxXu1Fa3M0k3HvfQ0vGn7QUnivTYtPXw7aDy5A+67H2kDAI+VSFwffnivtP9gHXG8Sa78SNZe2iszcf2V+6hXai7RcrwPU4yT61+T9fqH/wTd+98QPppf87qv0Xgbg3LcqqxjgKXJZS6t72b3b7I9Tgjj7Ns5z2Msyrc903tFfDFpbJbJs++/hwAy+KARkHXb/j8VrL0WU/DPV4fB9+wXwxqMm3Rp9pC2crn/kHysMgKSf8ARmO0Y/c/eVN+r8Nunij/ALDt9/Na7fV9H0zX9MuNH1i3W6s7pdkkb9GHXqMEEHkEEEHBBBr9XP6Ke5pUV5Daa9qXw2dNG8c3LXWgDCWetyZJjBbakGoN/CwyAtwcJJ0fa+PM9eoJCiiigD//1v2E8c/tFfDvwVcvpcT3ev6opKfZtLtZbpVcdRLcIpgix33uCOwJwD41c/H34PeKNSgsPij48s7dJFbb4eso7wQyscZ+0yPDHNdBegQJHEcnfG52lft2ql7YWOp2z2WpW8d3bycNHKgkRh7qwINRNSafK9f69CotX1PJbf44/Ce0gitbW+mhhiUJGiaZeqqoowAoEGAAOgFS/wDC+fhd/wBBK4/8F19/8Yo1P4C/CfUY2S30CPSXbJD6Y8mnsreoFs0an1wwIPcEV5Nqv7P/AI00a2c+E/EMWvCPJSHV0W3nYf3TdWsYj47Zts/3ietfmvEmYcWYWLnl+Ho10unNKEvud4/+THvYCjltR2rTlD5Jr8NfwOo8VfFXwN4r1Dwno2hXs013Jrtiyq9ndQrhCxPzyxIo49T9K+cf+Cgvg7xh4ri8DN4U0DUNcFqdSE32C0muzF5n2bbvEKsV3bTjPXBqW41Cfwl4w8H/APCfWM/hbbrNtukv9qWvyh87bpWa3bjkASZx1A5A9DOueXqH7r4o6KxkhhRbttbRjA9tMVVvJ85Y3823SMzAqd0jSYZQc10eH/EOY5zl9Wpm2FeHqKbjy67JRd9e991ppoeNxvwzha9GWBp1eaE47q19/n2PyQ/4VD8Xv+hB8Rf+Ce9/+NUv/Co/jBjb/wAIF4jx1x/Y97/8ar9ZoNYki0TUVX4naGmq6t+7dv8AhIfMit0NhbEvDubIYXsMqgKE/dzM+cqErb0XxRBpninT7q6+Iug3umQSMHB1zCpH50j5WNp2JJjKqBI8oGNp7OPqf7Bp92fiP/EDcu/5/T/8l/8AkT8ff+FQ/F7/AKEHxF/4J73/AONV+kn/AAT68HeMfCg8cP4r0DUdDF1/Zwh+32k1oZTH9o3bBMqltu4Zx0yK9MOtGPUf3XxQ0YrLFGiXTa2jm2a3kKRuIfOVJPNgSMzBlO6RpMFQQapPq9wmj6lKnxG0N9UvQjCP/hJGECv5VhlQwdWRBNFdH5NjFXHqVHRhcrhSnzps+g4Z8L8HleLWLo1JOSTVna2vokdtpH7QXwd+H2ueLfDPjHxNBpmpwa3du8DxzMwWQIynKIw5Bz1roP8Ahrf9nT/odrX/AL83H/xuvyr+Jnw58d/Gn9oDx3dfC3R5fEtpJqYX7balfsAbyYs5umIh47jeWx2r6P8AAf8AwTmvLiCG5+KPiz7M7YaS00VAxX/Z+03KEH3xAPY96axNeU3GMNF1YlxFntbGVaGHwa9nGTSnJuKaTtfa7+SZ9gT/ALWH7Nt1BJbXPjKzmhlUo6PBOysrDBDAxYII6g15Zpv7RHwS0S9mt/hD8Q9PvoFVc6BcrdyW8bDOPs0scMktqG6FNkkQwNkaHcW9h8J/sqfs/eDoo003wXZXcseP32oBr+VmH8Ra5MmCeuBgDsBXvNjYWGmWyWWm20dpbx8LHCixoo9lUACu6HP9qx91gfrNr4lxv2jf83/keI+Bv2i/h340uU0uZ7vQNUYhfs+p2stsjuegiuHUQS5/h2OSe4ByB7N/bei/8/8Ab/8Af1P8a06K1O8//9f9/KKKKACiiigCjqWmadrNhPpWr2sV9ZXSlJYJ0WSKRD1VkYEEexFfNXin9nCzt5JdS+GNzHpjsvOmXm+XT3ccgxP80tsT0OzfGByIt2SfqOivC4g4ZwGa4d4XMaKqQfRrbzT3T800zswWPrYaftKEnF/195+ccyS6XqieHvFGltomsOruttcKpEqx4DvbyrlJkXIJKElQRvCk4r4t/aohhXxX4eCxqM2Vx0A/56JX7meJ/CfhzxnpbaN4o0+LULQsHCyA7kcdHjcYZHGeHQhh2Ir4b8Y/sOzeOfH+l3mveLHl8I6XDIgjEZGqSh5A4hef/V7QBt80KHI7b/3lfzxk30fZZNxFQzLLKvNQ95OMn70bxklZ/aV9OjXnqzq8Qs6q53w7icr5Uqs+Wz6O04t37aJvrf8AA/K/wB8NPGvxS1tvD3gDRZNXvI9pmKALDbq5wrTzNhIwcHGTk4O0EjFfqX8HP2APBHhhoNc+LU6eKtTVQRYxbo9NhfqSR8slwR0HmYQjkxZwR9w+DfA/hH4e6FD4a8FaVBo+mwcrDAuMseC7scs7nHLMSx7muqr+kcJldOnq9WfkHCnhlgMuSqVV7Sr3ey9FsvV3foUdM0vTdF0+DStHtIrGytUCQwQIscUaDoqooAA9gKvUUV6Z+khRRRQAUUUUAf/Z";



// ════════════════════════════════════════════════════════════════
// CONSTANTES — Índices de abas (evita números mágicos)
// ════════════════════════════════════════════════════════════════
const TAB_SOLICITACAO=0;
const TAB_LOCAL=1;
const TAB_VESTIGIOS=2;
const TAB_CADAVER=3;
const TAB_VEICULO=4;
const TAB_EXPORTAR=5;
const TAB_DESENHO=6;
const LOCALE="pt-BR";
// Formata data com ano de 2 dígitos: "25/04/26 14:30"
const fmtDt=(d)=>{if(!d)return"";const dt=d instanceof Date?d:new Date(d);if(isNaN(dt.getTime()))return"";const dd=String(dt.getDate()).padStart(2,"0"),mm=String(dt.getMonth()+1).padStart(2,"0"),yy=String(dt.getFullYear()).slice(-2),hh=String(dt.getHours()).padStart(2,"0"),mi=String(dt.getMinutes()).padStart(2,"0");return`${dd}/${mm}/${yy} ${hh}:${mi}`;};
// v247: parseia o formato fmtDt de volta pra Date — usado no cronômetro de
// chegada (calcula tempo decorrido desde que o perito chegou na cena).
const parseFmtDt=(s)=>{if(!s||typeof s!=="string")return null;const m=s.match(/^(\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);if(!m)return null;const yy=parseInt(m[3]);const year=yy>=70?1900+yy:2000+yy;const d=new Date(year,parseInt(m[2])-1,parseInt(m[1]),parseInt(m[4]),parseInt(m[5]));return isNaN(d.getTime())?null:d;};
// v247: formata duração em "Xh Ym" ou "Ym" — pílula pequena no header
const fmtDur=(ms)=>{if(ms<0)return"0m";const totalMin=Math.floor(ms/60000);const h=Math.floor(totalMin/60);const m=totalMin%60;return h>0?`${h}h ${m}m`:`${m}m`;};
const BACKUP_EXPIRY_MS=48*60*60*1000; // 48 horas em milissegundos
// UID generator — monotônico, sem colisão em loops rápidos
let _uidSeq=0;const uid=()=>{_uidSeq=(_uidSeq+1)%999999;return Date.now()*1000+_uidSeq;};
const mkEdif=(id=1)=>({id,nome:"",obs:"",tipo:"",andares:"",estado:"",acesso:"",comodos_fato:[],material:"",cobertura:"",muro:"",portao:"",n_entradas:"",ilum_int:"",cameras:"",comodos_list:[],comodos_fato_det:{},vizinhanca:""});

// ════════════════════════════════════════════════════════════════
// IMAGENS DO CORPO — Base64 JPEG (comprimidas ~8-18KB cada)
// Corpo: frente, costas, lateral esquerda, lateral direita
// Cabeça: frente, atrás, perfil esquerdo, perfil direito
// ════════════════════════════════════════════════════════════════
const BODY_F="/img/anatomy/body-front.jpg";
const BODY_B="/img/anatomy/body-back.jpg";
const BODY_L="/img/anatomy/body-left.jpg";
const BODY_R="/img/anatomy/body-right.jpg";

const HEAD_F="/img/anatomy/head-front.jpg";
const HEAD_B="/img/anatomy/head-back.jpg";
const HEAD_L="/img/anatomy/head-left.jpg";
const HEAD_R="/img/anatomy/head-right.jpg";
import { ChevronLeft, ChevronRight, Sun, Moon, MapPin, Clock, Camera, Plus, HardDrive, Copy, Image as ImageIcon, Layers } from "lucide-react";

// ════════════════════════════════════════════════════════════════
// DADOS DE REFERÊNCIA — Regiões anatômicas e tipos de lesão
// RF: Regiões frontais (corpo frente)
// RB: Regiões posteriores (corpo costas)
// RH: Regiões da cabeça
// WT: Tipos de ferida/lesão
// VVT: Tipos de vestígio veicular (usado no selector da aba Veículo, line ~2212)
// ════════════════════════════════════════════════════════════════

const WT=["1. Orifício entrada (PAF)","2. Orifício saída (PAF)","3. Escoriação","4. Equimose","5. Hematoma","6. Fratura","7. Contusa","8. Incisa","9. Punctória","10. Cortocontusa","11. Perfuroincisa","12. Jellineck","13. Sulco","14. Laceração","15. Tatuagem","16. Petéquia","17. Aderência de sujidades","18. Manchas de sangue","19. Outro"];
const RF=[{id:"f_cerv_ant",l:"Pescoço frente (Cervical anterior)"},{id:"f_esternal",l:"Centro do peito (Esternal)"},{id:"f_torac_d",l:"Peito direito (Torácica D)"},{id:"f_torac_e",l:"Peito esquerdo (Torácica E)"},{id:"f_epigast",l:"Boca do estômago (Epigástrica)"},{id:"f_hipoc_d",l:"Costelas baixas D (Hipocôndrio D)"},{id:"f_hipoc_e",l:"Costelas baixas E (Hipocôndrio E)"},{id:"f_mesogast",l:"Meio do abdômen (Mesogástrica)"},{id:"f_hipogast",l:"Baixo ventre (Hipogástrica)"},{id:"f_flanco_d",l:"Lateral barriga D (Flanco D)"},{id:"f_flanco_e",l:"Lateral barriga E (Flanco E)"},{id:"f_pubiana",l:"Acima do púbis (Púbica)"},{id:"f_genital",l:"Região genital (Genital)"},{id:"f_supraclav_d",l:"Acima da clavícula D (Supraclavicular D)"},{id:"f_supraclav_e",l:"Acima da clavícula E (Supraclavicular E)"},{id:"f_braco_d",l:"Braço D (frente)"},{id:"f_braco_e",l:"Braço E (frente)"},{id:"f_cubital_d",l:"Dobra do cotovelo D (Cubital D)"},{id:"f_cubital_e",l:"Dobra do cotovelo E (Cubital E)"},{id:"f_antebr_d",l:"Antebraço D (frente)"},{id:"f_antebr_e",l:"Antebraço E (frente)"},{id:"f_coxa_d",l:"Coxa D (frente)"},{id:"f_coxa_e",l:"Coxa E (frente)"},{id:"f_joelho_d",l:"Joelho D (frente)"},{id:"f_joelho_e",l:"Joelho E (frente)"},{id:"f_perna_d",l:"Canela D (Perna anterior D)"},{id:"f_perna_e",l:"Canela E (Perna anterior E)"}];
const RB=[{id:"b_cerv_post",l:"Pescoço atrás (Cervical posterior)"},{id:"b_escapular_d",l:"Omoplata D (Escapular D)"},{id:"b_escapular_e",l:"Omoplata E (Escapular E)"},{id:"b_dorsal",l:"Costas alta (Dorsal)"},{id:"b_lombar_d",l:"Cintura D (Lombar D)"},{id:"b_lombar_e",l:"Cintura E (Lombar E)"},{id:"b_sacro_d",l:"Acima da nádega D (Sacral D)"},{id:"b_sacro_e",l:"Acima da nádega E (Sacral E)"},{id:"b_glutea_d",l:"Nádega D (Glútea D)"},{id:"b_glutea_e",l:"Nádega E (Glútea E)"},{id:"b_coxa_d",l:"Coxa atrás D (Posterior D)"},{id:"b_coxa_e",l:"Coxa atrás E (Posterior E)"},{id:"b_perna_d",l:"Panturrilha D (Gemelar D)"},{id:"b_perna_e",l:"Panturrilha E (Gemelar E)"},{id:"b_deltoid_d",l:"Ombro D (Deltoidiana D)"},{id:"b_deltoid_e",l:"Ombro E (Deltoidiana E)"},{id:"b_braco_d",l:"Braço atrás D (Posterior D)"},{id:"b_braco_e",l:"Braço atrás E (Posterior E)"},{id:"b_antebr_d",l:"Antebraço atrás D (Posterior D)"},{id:"b_antebr_e",l:"Antebraço atrás E (Posterior E)"}];
const RH=[{id:"h_frontal",l:"Testa (Frontal)"},{id:"h_parietal_d",l:"Lateral cabeça D (Parietal D)"},{id:"h_parietal_e",l:"Lateral cabeça E (Parietal E)"},{id:"h_temporal_d",l:"Têmpora D (Temporal D)"},{id:"h_temporal_e",l:"Têmpora E (Temporal E)"},{id:"h_occipital",l:"Nuca (Occipital)"},{id:"h_vertex",l:"Topo da cabeça (Vértex)"},{id:"h_orbit_d",l:"Olho D (Orbitária D)"},{id:"h_orbit_e",l:"Olho E (Orbitária E)"},{id:"h_nasal",l:"Nariz (Nasal)"},{id:"h_labial_sup",l:"Lábio superior (Labial superior)"},{id:"h_labial_inf",l:"Lábio inferior (Labial inferior)"},{id:"h_mentoniana",l:"Queixo (Mentoniana)"},{id:"h_auricular_d",l:"Orelha D (Auricular D)"},{id:"h_auricular_e",l:"Orelha E (Auricular E)"}];
const RMD=[{id:"md_palma",l:"Palma da mão D (Palmar D)"},{id:"md_dorso",l:"Dorso da mão D (Dorsal D)"},{id:"md_polegar",l:"Polegar D (1º quirodáctilo D)"},{id:"md_indicador",l:"Indicador D (2º quirodáctilo D)"},{id:"md_medio",l:"Dedo médio D (3º quirodáctilo D)"},{id:"md_anelar",l:"Anelar D (4º quirodáctilo D)"},{id:"md_minimo",l:"Mindinho D (5º quirodáctilo D / Mínimo D)"},{id:"md_punho",l:"Punho D (Carpo D)"}];
const RME=[{id:"me_palma",l:"Palma da mão E (Palmar E)"},{id:"me_dorso",l:"Dorso da mão E (Dorsal E)"},{id:"me_polegar",l:"Polegar E (1º quirodáctilo E)"},{id:"me_indicador",l:"Indicador E (2º quirodáctilo E)"},{id:"me_medio",l:"Dedo médio E (3º quirodáctilo E)"},{id:"me_anelar",l:"Anelar E (4º quirodáctilo E)"},{id:"me_minimo",l:"Mindinho E (5º quirodáctilo E / Mínimo E)"},{id:"me_punho",l:"Punho E (Carpo E)"}];
const RPD=[{id:"pd_planta",l:"Planta do pé D (Plantar D)"},{id:"pd_dorso",l:"Peito do pé D (Dorsal D)"},{id:"pd_calcanhar",l:"Calcanhar D — peito (Calcâneo D, Dorsal)"},{id:"pd_dedao",l:"Dedão D — peito (Hálux D, Dorsal)"},{id:"pd_2dedo",l:"2º dedo D — peito (2º pododáctilo D)"},{id:"pd_3dedo",l:"3º dedo D — peito (3º pododáctilo D)"},{id:"pd_4dedo",l:"4º dedo D — peito (4º pododáctilo D)"},{id:"pd_mindinho",l:"Mindinho D — peito (5º pododáctilo D)"},{id:"pd_tornoz",l:"Tornozelo D — peito (Tarso D, Dorsal)"},{id:"pd_pl_calcanhar",l:"Calcanhar D — sola (Calcâneo D, Plantar)"},{id:"pd_pl_dedao",l:"Dedão D — sola (Hálux D, Plantar)"},{id:"pd_pl_2dedo",l:"2º dedo D — sola (2º pododáctilo D, Plantar)"},{id:"pd_pl_3dedo",l:"3º dedo D — sola (3º pododáctilo D, Plantar)"},{id:"pd_pl_4dedo",l:"4º dedo D — sola (4º pododáctilo D, Plantar)"},{id:"pd_pl_mindinho",l:"Mindinho D — sola (5º pododáctilo D, Plantar)"},{id:"pd_pl_tornoz",l:"Tornozelo D — sola (Tarso D, Plantar)"}];
const RPE=[{id:"pe_planta",l:"Planta do pé E (Plantar E)"},{id:"pe_dorso",l:"Peito do pé E (Dorsal E)"},{id:"pe_calcanhar",l:"Calcanhar E — peito (Calcâneo E, Dorsal)"},{id:"pe_dedao",l:"Dedão E — peito (Hálux E, Dorsal)"},{id:"pe_2dedo",l:"2º dedo E — peito (2º pododáctilo E)"},{id:"pe_3dedo",l:"3º dedo E — peito (3º pododáctilo E)"},{id:"pe_4dedo",l:"4º dedo E — peito (4º pododáctilo E)"},{id:"pe_mindinho",l:"Mindinho E — peito (5º pododáctilo E)"},{id:"pe_tornoz",l:"Tornozelo E — peito (Tarso E, Dorsal)"},{id:"pe_pl_calcanhar",l:"Calcanhar E — sola (Calcâneo E, Plantar)"},{id:"pe_pl_dedao",l:"Dedão E — sola (Hálux E, Plantar)"},{id:"pe_pl_2dedo",l:"2º dedo E — sola (2º pododáctilo E, Plantar)"},{id:"pe_pl_3dedo",l:"3º dedo E — sola (3º pododáctilo E, Plantar)"},{id:"pe_pl_4dedo",l:"4º dedo E — sola (4º pododáctilo E, Plantar)"},{id:"pe_pl_mindinho",l:"Mindinho E — sola (5º pododáctilo E, Plantar)"},{id:"pe_pl_tornoz",l:"Tornozelo E — sola (Tarso E, Plantar)"}];
const AR=[...RF,...RB,...RH,...RMD,...RME,...RPD,...RPE];
// Vehicle regions
const RVE=[{id:"ve_porta_ant_e",l:"Face externa da porta anterior esquerda"},{id:"ve_porta_pos_e",l:"Face externa da porta posterior esquerda"},{id:"ve_vidro_ant_e",l:"Vidro da porta anterior esquerda"},{id:"ve_vidro_pos_e",l:"Vidro da porta posterior esquerda"},{id:"ve_retrovisor_e",l:"Retrovisor esquerdo"},{id:"ve_paralama_ant_e",l:"Para-lama anterior esquerdo"},{id:"ve_paralama_pos_e",l:"Para-lama posterior esquerdo"},{id:"ve_parachoque_ant_e",l:"Para-choque anterior esquerdo"},{id:"ve_parachoque_pos_e",l:"Para-choque posterior esquerdo"},{id:"ve_roda_ant_e",l:"Roda anterior esquerda"},{id:"ve_roda_pos_e",l:"Roda posterior esquerda"},{id:"ve_pneu_ant_e",l:"Pneu anterior esquerdo"},{id:"ve_pneu_pos_e",l:"Pneu posterior esquerdo"},{id:"ve_soleira_e",l:"Soleira esquerda"},{id:"ve_coluna_a_e",l:"Coluna A esquerda"},{id:"ve_coluna_b_e",l:"Coluna B esquerda"},{id:"ve_coluna_c_e",l:"Coluna C esquerda"}];
const RVD=[{id:"ve_porta_ant_d",l:"Face externa da porta anterior direita"},{id:"ve_porta_pos_d",l:"Face externa da porta posterior direita"},{id:"ve_vidro_ant_d",l:"Vidro da porta anterior direita"},{id:"ve_vidro_pos_d",l:"Vidro da porta posterior direita"},{id:"ve_retrovisor_d",l:"Retrovisor direito"},{id:"ve_paralama_ant_d",l:"Para-lama anterior direito"},{id:"ve_paralama_pos_d",l:"Para-lama posterior direito"},{id:"ve_parachoque_ant_d",l:"Para-choque anterior direito"},{id:"ve_parachoque_pos_d",l:"Para-choque posterior direito"},{id:"ve_roda_ant_d",l:"Roda anterior direita"},{id:"ve_roda_pos_d",l:"Roda posterior direita"},{id:"ve_pneu_ant_d",l:"Pneu anterior direito"},{id:"ve_pneu_pos_d",l:"Pneu posterior direito"},{id:"ve_soleira_d",l:"Soleira direita"},{id:"ve_coluna_a_d",l:"Coluna A direita"},{id:"ve_coluna_b_d",l:"Coluna B direita"},{id:"ve_coluna_c_d",l:"Coluna C direita"}];
const RVF=[{id:"ve_capo",l:"Capô"},{id:"ve_parabrisa",l:"Para-brisa dianteiro"},{id:"ve_farol_e",l:"Farol dianteiro esquerdo"},{id:"ve_farol_d",l:"Farol dianteiro direito"},{id:"ve_grade",l:"Grade frontal"},{id:"ve_parachoque_d_e",l:"Para-choque dianteiro esquerdo"},{id:"ve_parachoque_d_c",l:"Para-choque dianteiro central"},{id:"ve_parachoque_d_d",l:"Para-choque dianteiro direito"},{id:"ve_placa_d",l:"Placa dianteira"}];
const RVT=[{id:"ve_portamalas",l:"Tampa do porta-malas"},{id:"ve_vidro_tras",l:"Vidro traseiro"},{id:"ve_lanterna_e",l:"Lanterna traseira esquerda"},{id:"ve_lanterna_d",l:"Lanterna traseira direita"},{id:"ve_parachoque_t_e",l:"Para-choque traseiro esquerdo"},{id:"ve_parachoque_t_c",l:"Para-choque traseiro central"},{id:"ve_parachoque_t_d",l:"Para-choque traseiro direito"},{id:"ve_placa_t",l:"Placa traseira"}];
const RVTe=[{id:"ve_teto_ant_e",l:"Teto anterior esquerdo"},{id:"ve_teto_ant_d",l:"Teto anterior direito"},{id:"ve_teto_pos_e",l:"Teto posterior esquerdo"},{id:"ve_teto_pos_d",l:"Teto posterior direito"}];
const RVI=[{id:"vi_volante",l:"Volante"},{id:"vi_painel",l:"Painel de instrumentos"},{id:"vi_cambio",l:"Alavanca de câmbio"},{id:"vi_freio_estac",l:"Freio de estacionamento"},{id:"vi_banco_mot",l:"Banco do motorista"},{id:"vi_banco_pass",l:"Banco do passageiro"},{id:"vi_banco_tras_e",l:"Banco traseiro esquerdo"},{id:"vi_banco_tras_d",l:"Banco traseiro direito"},{id:"vi_banco_tras_c",l:"Banco traseiro central"},{id:"vi_assoalho_ant",l:"Assoalho dianteiro"},{id:"vi_assoalho_pos",l:"Assoalho traseiro"},{id:"vi_forro_teto",l:"Forro do teto"},{id:"vi_porta_int_ant_e",l:"Face interna da porta anterior esquerda"},{id:"vi_porta_int_ant_d",l:"Face interna da porta anterior direita"},{id:"vi_porta_int_pos_e",l:"Face interna da porta posterior esquerda"},{id:"vi_porta_int_pos_d",l:"Face interna da porta posterior direita"},{id:"vi_portamalas_int",l:"Interior do porta-malas"},{id:"vi_console",l:"Console central"},{id:"vi_porta_luvas",l:"Porta-luvas"},{id:"vi_retrovisor_int",l:"Retrovisor interno"}];
const AV=[...RVE,...RVD,...RVF,...RVT,...RVTe,...RVI];
const VVT=["Amassamentos","Ausência de partes / peças","Avarias produzidas por ação do calor","Elementos balísticos","Indícios de presença de fluido(s) biológico(s) no interior do veículo","Mancha(s) de sangue de alta velocidade","Mancha(s) de sangue de média velocidade","Mancha(s) de sangue formada(s) por arrastamento","Mancha(s) de sangue formada(s) por contato","Mancha(s) de sangue formada(s) por gotejamento","Manchas de sangue","Marca(s) de alimpadura","Marca(s) de impacto produzida(s) por objeto(s) em ação contundente","Marca(s) de impacto tipicamente produzida(s) por projétil(eis) de arma de fogo","Marcas de fricção","Não foram encontrados elementos de interesse pericial","Perfuração(ões) tipicamente produzida(s) por projétil(eis) de arma de fogo","Presença de manchas latentes reveladas com o uso de luminol","Presença de sangue humano","Quebramentos","Veste(s) com orifício(s) típico(s) daquele(s) produzido(s) por passagem de projétil expelido por arma de fogo","Vestes com sangue","Outro"];

// ──────────────────────────────────────────
// PERITOS — matrícula → nome (Title Case já aplicado)
// Lookup tolera variações: com/sem pontos, hífens ou letras maiúsculas
// ──────────────────────────────────────────
const PERITOS={"226.823-X":"Kellen Maia","238.826-X":"Victor Costa","238.838-3":"Renata","244.597-2":"Menegoi","244.600-6":"Jaqueline","244.601-4":"Gabriel Marques","244.627-8":"Laura","244.628-6":"Cachuté","244.633-2":"Patrício","244.644-8":"Leonardo Guedes","244.646-4":"Allan Fernandes","244.648-0":"Bomtempo","244.649-9":"Alexandre Moura","244.654-5":"Muria","244.666-9":"André Ventura","244.667-7":"Gabriela","244.668-5":"Lucinda","244.671-5":"Ana Fraiz","244.708-8":"Camargos","244.713-4":"Lia Guazzelli","244.753-3":"Mauricio Rocha","244.754-1":"Fabio Rodrigues","244.832-7":"Borduqui","1.699.460-4":"Carvalho","1.699.469-8":"Goulart","1.707.648-X":"Camilo"};
const toTitleCase=(s)=>String(s||"").toLowerCase().split(" ").map(w=>w?w[0].toUpperCase()+w.slice(1):w).join(" ");
// Helpers for tp (Tipo) which can be array or string (legacy)
const tpStr=(v)=>Array.isArray(v)?v.join(", "):(v||"");
const tpHas=(v,opt)=>Array.isArray(v)?v.includes(opt):v===opt;
const normMat=(m)=>String(m||"").trim().toUpperCase().replace(/\s+/g,"").replace(/[.\-]/g,"");
const lookupPerito=(m)=>{if(!m)return"";if(PERITOS[m])return PERITOS[m];const n=normMat(m);if(!n)return"";for(const k of Object.keys(PERITOS)){if(normMat(k)===n)return PERITOS[k];}return"";};
const PERITOS_LIST=Object.entries(PERITOS).map(([mat,nome])=>({mat,nome})).sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));

const VEST_GROUPS=[
{l:"🔫 Balísticos",items:["Estojo de arma de fogo","Projétil de arma de fogo","Fragmento de projétil","Chumbo","Elemento balístico","Carregador","Arma de fogo","Munição intacta"]},
{l:"🩸 Biológicos",items:["Sangue","Possív. material genético","Cabelo/pelo","Dente","Saliva","Vômito"]},
{l:"🔪 Instrumentos",items:["Faca","Arma branca","Pedra/bloco","Pedaço de madeira","Corda/cordão","Vidro fragmentado","Ferramenta"]},
{l:"📱 Objetos Pessoais",items:["Celular","Documento de identidade","Carteira/bolsa","Chave","Relógio","Óculos","Calçado"]},
{l:"💊 Substâncias",items:["Subst. pardo esverdeada","Pó branco","Medicamento/embalagem","Líquido suspeito","Seringa/agulha"]},
{l:"🧤 Microvestígios",items:["Fibra/tecido","Impressão de calçado","Marca de pneu","Tinta/transferência","Copo/garrafa","Bituca de cigarro","Preservativo"]}
];


// ════════════════════════════════════════════════════════════════
// COMPONENTES REUTILIZÁVEIS (fora do App)
// VestPk: Seletor de pacotes de vestígios
// F_: Campo de texto (input/textarea)
// SN_: Sim/Não toggle
// Rd_: Radio buttons
// Cd_: Card colapsável (seção)
// Rg_: Região clicável no SVG do corpo
// VRg: Região clicável no SVG do veículo
// ════════════════════════════════════════════════════════════════
const VestPk=({val,onSelect,styles:st})=>{const[open,setOpen]=React.useState(false);const wrapRef=React.useRef(null);React.useEffect(()=>{if(!open)return;const h=e=>{if(wrapRef.current&&!wrapRef.current.contains(e.target))setOpen(false);};document.addEventListener("pointerdown",h);return()=>document.removeEventListener("pointerdown",h);},[open]);return(<div ref={wrapRef} style={{position:"relative"}}><button type="button" style={{...st.inp,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,color:val?st.tx:"#999"}} onClick={()=>setOpen(!open)}><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{val||"— Selecione vestígio —"}</span><span style={{fontSize:10,marginLeft:6}}>{open?"▲":"▼"}</span></button>{open&&<div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:50,background:st.cd,border:`2px solid ${st.ac}`,borderRadius:12,marginTop:4,maxHeight:320,overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,0.3)"}}>{VEST_GROUPS.map(g=><details key={g.l} style={{borderBottom:`1px solid ${st.bd}`}}><summary style={{padding:"10px 12px",fontSize:12,fontWeight:600,color:st.ac,cursor:"pointer",background:st.hdbg}}><IconText text={g.l} size={14} gap={5}/></summary><div style={{display:"flex",flexWrap:"wrap",gap:4,padding:"8px 10px"}}>{g.items.map(item=><button type="button" key={item} style={{padding:"6px 10px",fontSize:11,borderRadius:16,border:`1px solid ${val===item?st.ac:st.bd}`,background:val===item?"rgba(0,122,255,0.1)":"transparent",color:val===item?st.ac:st.tx,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>{onSelect(item);setOpen(false);}}>{item}</button>)}</div></details>)}<button type="button" style={{width:"100%",padding:"10px 12px",fontSize:12,fontWeight:600,color:"#ff9500",background:"transparent",border:"none",borderTop:`1px solid ${st.bd}`,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}} onClick={()=>{onSelect("");setOpen(false);}}><AppIcon name="✏️" size={14} mr={4}/>Outro (digitar manualmente)</button></div>}</div>);};

/* F_ v201: campo universal com auto-grow + microfone + scroll inteligente.
   Inputs comuns viram textareas auto-cresciveis (estilo iOS Notes).
   Tipos numéricos/data/hora ficam como input nativo (teclado correto).
   ensureCaretVisible mantém o cursor sempre acima do teclado virtual e do botão de mic. */
const F_=React.memo(({k,label,type,ph,val,onChange,styles:st})=>{
const r=React.useRef(null);const kRef=React.useRef(k);const cbRef=React.useRef(onChange);const valRef=React.useRef(val);const recogRef=React.useRef(null);const[listening,setListening]=React.useState(false);kRef.current=k;cbRef.current=onChange;valRef.current=val;
// v202: Microfone APENAS em textarea (campos de observação grandes).
// Antes: aparecia em todo input single-line por engano (date, número, etc.).
// Hoje: só campos longos têm mic. Outros são input nativo limpo.
const isTextarea=type==="textarea";
const autoGrow=React.useCallback((el)=>{if(!el)return;el.style.height="auto";el.style.height=Math.min(el.scrollHeight+2,600)+"px";},[]);
const ensureCaretVisible=React.useCallback(()=>{const el=r.current;if(!el)return;requestAnimationFrame(()=>{try{const rect=el.getBoundingClientRect();const vh=window.visualViewport?.height||window.innerHeight;const safeBottom=vh-12;if(rect.bottom>safeBottom){el.scrollIntoView({block:"end",behavior:"smooth"});}}catch(e){/* noop */}});},[]);
React.useEffect(()=>{if(isTextarea&&r.current)autoGrow(r.current);},[val,isTextarea,autoGrow]);
React.useEffect(()=>()=>{if(r.current&&r.current.value!==valRef.current)cbRef.current(kRef.current,r.current.value);try{recogRef.current?.stop();}catch(e){console.warn("CQ recog cleanup:",e);}},[]);
const toggleDict=React.useCallback(()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){(window.__cqToast||window.alert)("⚠ Ditado por voz não suportado — use o teclado");return;}if(listening){try{recogRef.current?.stop();}catch(e){console.warn("CQ recog toggle:",e);}return;}const rec=new SR();rec.lang="pt-BR";rec.continuous=true;rec.interimResults=true;let finalTranscript=r.current?.value||"";let interimTranscript="";rec.onresult=(ev)=>{interimTranscript="";for(let i=ev.resultIndex;i<ev.results.length;i++){const t2=ev.results[i][0].transcript;if(ev.results[i].isFinal){finalTranscript+=(finalTranscript&&!finalTranscript.match(/[\s\n]$/)?" ":"")+t2;}else{interimTranscript+=t2;}}if(r.current){r.current.value=finalTranscript+(interimTranscript?(" "+interimTranscript):"");autoGrow(r.current);ensureCaretVisible();}};rec.onerror=(e)=>{console.warn("CQ dict:",e.error);setListening(false);if(e.error==="not-allowed"||e.error==="service-not-allowed"){(window.__cqToast||window.alert)("⚠ Microfone negado — libere nas configurações");}};rec.onend=()=>{setListening(false);if(r.current&&r.current.value!==valRef.current){cbRef.current(kRef.current,r.current.value);valRef.current=r.current.value;}};recogRef.current=rec;try{rec.start();setListening(true);if(navigator.vibrate)navigator.vibrate(20);}catch(e){console.warn("CQ dict start:",e);setListening(false);}},[listening,autoGrow,ensureCaretVisible]);
// v202: Botão de mic 40×40 (área de toque generosa, segue Apple HIG 44pt),
// ícone visualmente reduzido a 14 (parecia grande demais antes a 18).
if(isTextarea){return(<div style={{position:"relative"}}><label style={st.lb}>{label}</label><textarea ref={r} rows={1} style={{...st.ta,resize:"none",overflow:"hidden",minHeight:72,paddingRight:50,paddingTop:10,paddingBottom:10}} defaultValue={val||""} placeholder={ph||""} onInput={e=>{autoGrow(e.target);ensureCaretVisible();}} onFocus={()=>ensureCaretVisible()} onBlur={e=>onChange(k,e.target.value)}/><button type="button" onClick={toggleDict} title={listening?"Parar ditado":"Ditar por voz"} aria-label={listening?"Parar ditado por voz":"Iniciar ditado por voz"} style={{position:"absolute",right:4,top:28,width:40,height:40,borderRadius:"50%",background:listening?"#ff3b30":"rgba(10,132,255,0.10)",color:listening?"#fff":"#0a84ff",border:listening?"none":"1px solid rgba(10,132,255,0.25)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,fontFamily:"inherit",boxShadow:listening?"0 0 0 3px rgba(255,59,48,0.20)":"none",animation:listening?"savePulse 1.2s ease-in-out infinite":"none",WebkitTapHighlightColor:"transparent"}}>{listening?<span style={{fontSize:11,fontWeight:700}}>⏸</span>:<AppIcon name="🎤" size={14} mr={0}/>}</button></div>);}
return(<div><label style={st.lb}>{label}</label><input autoComplete="off" autoCorrect="off" spellCheck={false} ref={r} style={st.inp} type={type||"text"} defaultValue={val||""} placeholder={ph||""} onBlur={e=>onChange(k,e.target.value)}/></div>);
},(a,b)=>a.k===b.k&&a.label===b.label&&a.type===b.type&&a.val===b.val);
/* TX_ v201: textarea auto-grow simples, sem botão de microfone.
   Drop-in para substituir <input style={inp} defaultValue=... onBlur=...> em listas
   onde o microfone do F_ atrapalharia visualmente (vestígios, papilos, etc.).
   API: { value, onCommit, placeholder, fontSize, style, multilineMin } */
const TX_=React.memo(({value,onCommit,placeholder,fontSize,style,multilineMin,inputStyle,inputKey})=>{
  const r=React.useRef(null);
  const valRef=React.useRef(value);valRef.current=value;
  const autoGrow=React.useCallback((el)=>{if(!el)return;el.style.height="auto";el.style.height=Math.min(el.scrollHeight+2,600)+"px";},[]);
  const ensureCaretVisible=React.useCallback(()=>{const el=r.current;if(!el)return;requestAnimationFrame(()=>{try{const rect=el.getBoundingClientRect();const vh=window.visualViewport?.height||window.innerHeight;if(rect.bottom>vh-12)el.scrollIntoView({block:"end",behavior:"smooth"});}catch(e){/* noop */}});},[]);
  React.useEffect(()=>{if(r.current)autoGrow(r.current);},[value,autoGrow]);
  React.useEffect(()=>()=>{if(r.current&&r.current.value!==valRef.current)onCommit(r.current.value);},[]);
  const baseStyle=inputStyle||{};
  return(<textarea key={inputKey} ref={r} rows={1}
    style={{...baseStyle,resize:"none",overflow:"hidden",
      minHeight:multilineMin||38,
      paddingTop:9,paddingBottom:9,
      fontSize:fontSize||baseStyle.fontSize||14,
      ...style}}
    defaultValue={value||""} placeholder={placeholder||""}
    onInput={e=>{autoGrow(e.target);ensureCaretVisible();}}
    onFocus={()=>ensureCaretVisible()}
    onBlur={e=>onCommit(e.target.value)}
    autoComplete="off" autoCorrect="off" spellCheck={false}
  />);
});
const SN_=React.memo(({k,label,val,onChange,styles:st})=>(<div>{label&&<label style={st.lb}>{label}</label>}<div style={{display:"flex"}}><button type="button" style={{...st.tY(val==="Sim"),transition:"background 0.15s ease,border-color 0.15s ease,color 0.15s ease",animation:val==="Sim"?"snPickPop 0.35s cubic-bezier(0.34,1.56,0.64,1)":"none"}} onClick={()=>onChange(k,val==="Sim"?"":"Sim")} aria-label={val==="Sim"?"Desmarcar Sim":"Marcar Sim"}>✓</button><button type="button" style={{...st.tN(val==="Não"),transition:"background 0.15s ease,border-color 0.15s ease,color 0.15s ease",animation:val==="Não"?"snPickPop 0.35s cubic-bezier(0.34,1.56,0.64,1)":"none"}} onClick={()=>onChange(k,val==="Não"?"":"Não")} aria-label={val==="Não"?"Desmarcar Não":"Marcar Não"}>✗</button></div></div>));
const Rd_=React.memo(({k,opts,label,val,onChange,styles:st})=>(<div>{label&&<label style={st.lb}>{label}</label>}<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>{opts.map(o=><button type="button" key={o} style={{...st.ch(val===o),transition:"background 0.15s ease,border-color 0.15s ease,color 0.15s ease",animation:val===o?"snPickPop 0.35s cubic-bezier(0.34,1.56,0.64,1)":"none"}} onClick={()=>onChange(k,val===o?"":o)} aria-label={val===o?`Desmarcar ${o}`:`Selecionar ${o}`} aria-pressed={val===o}>{o}</button>)}</div></div>));
const Ck_=React.memo(({k,opts,label,val,onChange,styles:st})=>{const sl=val||[];const tg=o=>{const a=[...sl];const i=a.indexOf(o);if(i>-1)a.splice(i,1);else a.push(o);onChange(k,a);};return(<div>{label&&<label style={st.lb}>{label}</label>}<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>{opts.map(o=><button type="button" key={o} style={st.ch(sl.includes(o))} onClick={()=>tg(o)}>{o}</button>)}</div></div>);});
const Nw_=React.memo(({k,label,val,onChange,styles:st})=>{const r=React.useRef(null);const[showPk,setShowPk]=React.useState(false);const[pkY,setPkY]=React.useState("");const[pkM,setPkM]=React.useState("");const[pkD,setPkD]=React.useState("");const[pkH,setPkH]=React.useState("");const[pkMin,setPkMin]=React.useState("");const openPk=()=>{const now=new Date();setPkY(String(now.getFullYear()));setPkM(String(now.getMonth()+1).padStart(2,"0"));setPkD(String(now.getDate()).padStart(2,"0"));setPkH(String(now.getHours()).padStart(2,"0"));setPkMin(String(now.getMinutes()).padStart(2,"0"));setShowPk(true);};const applyPk=()=>{if(pkY&&pkM&&pkD){const d=new Date(parseInt(pkY),parseInt(pkM)-1,parseInt(pkD),parseInt(pkH||"0"),parseInt(pkMin||"0"));const v=fmtDt(d);onChange(k,v);if(r.current)r.current.value=v;}setShowPk(false);};const cardBg=st.dark?"linear-gradient(180deg,#1f1f22 0%,#141416 100%)":"linear-gradient(180deg,#ffffff 0%,#fafbfc 100%)";const cardShadow=st.dark?`0 2px 10px rgba(10,132,255,0.12),inset 0 1px 0 rgba(255,255,255,0.05)`:`0 2px 10px rgba(0,122,255,0.08),inset 0 1px 0 rgba(255,255,255,0.8)`;const selStyle={padding:"10px 24px 10px 8px",fontSize:16,fontWeight:600,border:`1.5px solid ${st.bd}`,borderRadius:10,background:st.dark?"#1c1c1e":"#fff",color:st.tx,fontFamily:"inherit",textAlign:"center",cursor:"pointer",appearance:"none",WebkitAppearance:"none",MozAppearance:"none",width:"100%",minWidth:0,backgroundImage:`url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='${encodeURIComponent(st.t2)}' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 6px center",backgroundSize:"10px 10px"};const dayCount=pkY&&pkM?new Date(parseInt(pkY),parseInt(pkM),0).getDate():31;const meses=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];const yearNow=new Date().getFullYear();return(<><div style={{position:"relative"}}><label style={st.lb}>{label}</label><div style={{display:"flex",gap:6,padding:4,background:cardBg,borderRadius:12,border:`1.5px solid ${st.bd}`,boxShadow:cardShadow,transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",alignItems:"center",overflow:"hidden",minWidth:0}}><input autoComplete="off" autoCorrect="off" spellCheck={false} ref={r} style={{flex:1,minWidth:0,cursor:"pointer",background:"transparent",border:"none",outline:"none",padding:"8px 10px",fontSize:14,color:st.tx,fontFamily:"inherit",borderRadius:8,boxShadow:"none",WebkitAppearance:"none"}} defaultValue={val||""} readOnly onClick={openPk}/><button type="button" style={{flexShrink:0,background:`linear-gradient(180deg,${st.ac} 0%,${st.ac}dd 100%)`,color:"#fff",padding:"7px 12px",display:"flex",alignItems:"center",gap:4,borderRadius:8,boxShadow:`0 2px 6px ${st.ac}55`,transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"}} onClick={()=>{const v=fmtDt(new Date());onChange(k,v);if(r.current)r.current.value=v;setShowPk(false);}}><Clock size={13}/>Agora</button></div></div>{showPk&&<div onClick={e=>{if(e.target===e.currentTarget)setShowPk(false);}} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",animation:"backdropIn 0.2s ease"}}><div style={{background:st.cd,border:`2px solid ${st.ac}`,borderRadius:18,padding:22,boxShadow:"0 12px 40px rgba(0,0,0,0.4)",maxWidth:460,width:"100%",animation:"modalPop 0.3s cubic-bezier(0.34,1.56,0.64,1)"}}><div style={{textAlign:"center",fontSize:15,fontWeight:700,color:st.tx,marginBottom:6}}>{label||"Data e hora"}</div><div style={{textAlign:"center",fontSize:11,color:st.t2,marginBottom:18,textTransform:"uppercase",letterSpacing:0.5}}>Selecione data e hora</div><div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:600,color:st.t2,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}><AppIcon name="📅" size={12} mr={4}/>Data</div><div style={{display:"grid",gridTemplateColumns:"1fr 1.4fr 1fr",gap:6}}><select value={pkD} onChange={e=>setPkD(e.target.value)} style={selStyle}>{Array.from({length:dayCount},(_,i)=>{const d=String(i+1).padStart(2,"0");return <option key={d} value={d}>{d}</option>;})}
</select><select value={pkM} onChange={e=>setPkM(e.target.value)} style={selStyle}>{meses.map((mn,i)=>{const mv=String(i+1).padStart(2,"0");return <option key={mv} value={mv}>{mn}</option>;})}
</select><select value={pkY} onChange={e=>setPkY(e.target.value)} style={selStyle}>{Array.from({length:6},(_,i)=>{const y=yearNow-3+i;return <option key={y} value={y}>{String(y).slice(-2)}</option>;})}
</select></div></div><div style={{marginBottom:18}}><div style={{fontSize:11,fontWeight:600,color:st.t2,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}><AppIcon name="🕐" size={12} mr={4}/>Hora</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}><select value={pkH} onChange={e=>setPkH(e.target.value)} style={selStyle}>{Array.from({length:24},(_,i)=>{const h=String(i).padStart(2,"0");return <option key={h} value={h}>{h}h</option>;})}
</select><select value={pkMin} onChange={e=>setPkMin(e.target.value)} style={selStyle}>{Array.from({length:60},(_,i)=>{const m=String(i).padStart(2,"0");return <option key={m} value={m}>{m}min</option>;})}
</select></div></div><div style={{display:"flex",gap:10}}><button type="button" style={{flex:1,padding:"13px",background:`linear-gradient(180deg,${st.ac} 0%,${st.ac}dd 100%)`,color:"#fff",border:"none",borderRadius:11,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 2px 8px ${st.ac}55`,display:"flex",alignItems:"center",justifyContent:"center",gap:5}} onClick={applyPk}><AppIcon name="✓" size={14} mr={4}/>Confirmar</button><button type="button" style={{flex:1,padding:"13px",background:"transparent",border:`1.5px solid ${st.bd}`,color:st.tx,borderRadius:11,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}} onClick={()=>setShowPk(false)}><AppIcon name="✕" size={14} mr={4}/>Cancelar</button></div></div></div>}</>);},(a,b)=>a.k===b.k&&a.label===b.label&&a.val===b.val);
// ════════════════════════════════════════════════════════════════
// CÂMERA RAJADA (BURST) — v226
// ════════════════════════════════════════════════════════════════
// Modal full-screen com getUserMedia que permite tirar várias fotos
// seguidas sem fechar a câmera entre cada uma. Ao concluir, todas as
// fotos capturadas são adicionadas ao state com a mesma ref (rk).
//
// Por que está fora do App: o modal precisa preservar stream de vídeo
// e fotos capturadas locais entre re-renders do App. Se fosse declarado
// dentro de App, seria recriado a cada render e perderia o estado.
// ════════════════════════════════════════════════════════════════
const BurstModal=React.memo(function BurstModal({rk,fotoHQ,onClose,onConfirm,utils}){
  const{uid,mkAutoLegend,captureGPS,haptic}=utils;
  const videoRef=React.useRef(null);
  const streamRef=React.useRef(null);
  const[captured,setCaptured]=React.useState([]);
  const[error,setError]=React.useState("");
  const[busy,setBusy]=React.useState(false);
  const[facing,setFacing]=React.useState("environment");
  const[finishing,setFinishing]=React.useState(false);
  React.useEffect(()=>{let cancelled=false;(async()=>{try{if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){throw new Error("Câmera não suportada neste navegador");}const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing,width:{ideal:1920},height:{ideal:1080}},audio:false});if(cancelled){stream.getTracks().forEach(t=>t.stop());return;}streamRef.current=stream;if(videoRef.current){videoRef.current.srcObject=stream;try{await videoRef.current.play();}catch(_){}}}catch(e){if(!cancelled)setError(String(e&&e.message||e||"Câmera indisponível"));}})();return()=>{cancelled=true;if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}};},[facing]);
  const capture=()=>{if(busy||finishing)return;const v=videoRef.current;if(!v||!v.videoWidth)return;setBusy(true);try{const w=v.videoWidth,h=v.videoHeight;const cv=document.createElement("canvas");cv.width=w;cv.height=h;cv.getContext("2d").drawImage(v,0,0,w,h);const maxW=fotoHQ?2400:1200;let outCv=cv;if(Math.max(w,h)>maxW){const r=maxW/Math.max(w,h);outCv=document.createElement("canvas");outCv.width=Math.round(w*r);outCv.height=Math.round(h*r);outCv.getContext("2d").drawImage(cv,0,0,outCv.width,outCv.height);}const quality=fotoHQ?0.92:0.78;const dataUrl=outCv.toDataURL("image/jpeg",quality);const sizeKB=Math.round(dataUrl.length*0.75/1024);const w2=outCv.width,h2=outCv.height;cv.width=0;cv.height=0;if(outCv!==cv){outCv.width=0;outCv.height=0;}setCaptured(prev=>[...prev,{_id:uid(),dataUrl,w:w2,h:h2,sizeKB}]);try{haptic(20);}catch(_){}}catch(e){setError("Falha ao capturar: "+String(e.message||e).slice(0,40));}finally{setBusy(false);}};
  const removeOne=(id)=>setCaptured(prev=>prev.filter(c=>c._id!==id));
  const finish=async()=>{if(!captured.length){onClose();return;}setFinishing(true);try{const legend=mkAutoLegend(rk);const gps=await captureGPS();const novas=captured.map(c=>({id:uid(),ref:rk,desc:legend.desc,fase:"",local:legend.local,dataUrl:c.dataUrl,w:c.w,h:c.h,sizeKB:c.sizeKB,ts:new Date().toISOString(),hq:fotoHQ,...(gps?{gps}:{})}));onConfirm(novas);}catch(e){setError("Erro ao concluir: "+String(e.message||e).slice(0,40));}finally{setFinishing(false);}};
  // v240: cancelar com confirmação quando há fotos não salvas (evita perda acidental)
  const handleCancel=()=>{if(finishing)return;if(captured.length>0){const msg=`Descartar ${captured.length} foto${captured.length>1?"s":""} capturada${captured.length>1?"s":""}?`;if(!window.confirm(msg))return;}onClose();};
  return(<div role="dialog" aria-modal="true" aria-label="Várias fotos seguidas" style={{position:"fixed",inset:0,background:"#000",zIndex:9999,display:"flex",flexDirection:"column"}}>
    <div style={{padding:"max(env(safe-area-inset-top),12px) 14px 8px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(0,0,0,0.55)",gap:8}}>
      <button type="button" onClick={handleCancel} disabled={finishing} aria-label={captured.length>0?`Cancelar e descartar ${captured.length} fotos`:"Cancelar"} style={{background:"rgba(255,255,255,0.15)",color:"#fff",border:"none",borderRadius:10,padding:"10px 14px",fontSize:14,fontWeight:600,cursor:finishing?"default":"pointer",fontFamily:"inherit",minHeight:44,opacity:finishing?0.5:1}}>Cancelar</button>
      <span style={{color:"#fff",fontSize:14,fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:6}}><Layers size={16} strokeWidth={2.2}/>Várias fotos{captured.length>0?` · ${captured.length}`:""}</span>
      <button type="button" disabled={!captured.length||finishing} onClick={finish} style={{background:captured.length&&!finishing?"#34c759":"rgba(255,255,255,0.15)",color:"#fff",border:"none",borderRadius:10,padding:"10px 14px",fontSize:14,fontWeight:700,cursor:captured.length&&!finishing?"pointer":"default",opacity:captured.length&&!finishing?1:0.5,fontFamily:"inherit",minHeight:44,whiteSpace:"nowrap"}}>{finishing?"…":(captured.length?`Concluir (${captured.length})`:"Concluir")}</button>
    </div>
    <div style={{flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:"#000"}}>
      {error?(<div style={{color:"#fff",padding:24,textAlign:"center",maxWidth:340}}><div style={{fontSize:48,marginBottom:12}}>📷</div><p style={{fontSize:14,marginBottom:8,fontWeight:600}}>{error}</p><p style={{fontSize:12,opacity:0.7,lineHeight:1.5}}>Verifique se você permitiu o acesso à câmera. Em iOS, vá em Ajustes → Safari → Câmera, ou reabra o app pela tela inicial.</p></div>):(<video ref={videoRef} playsInline muted autoPlay style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}}/>)}
    </div>
    {captured.length>0&&(<div style={{padding:"8px 12px",background:"rgba(0,0,0,0.6)",overflowX:"auto",whiteSpace:"nowrap",WebkitOverflowScrolling:"touch"}}>{captured.map((c,idx)=>(<span key={c._id} style={{display:"inline-block",position:"relative",marginRight:6,verticalAlign:"top"}}><img src={c.dataUrl} alt={`Foto ${idx+1}`} style={{width:54,height:54,objectFit:"cover",borderRadius:6,border:"1.5px solid rgba(255,255,255,0.6)"}}/><button type="button" aria-label={`Remover foto ${idx+1}`} onClick={()=>removeOne(c._id)} style={{position:"absolute",top:-6,right:-6,width:24,height:24,borderRadius:"50%",background:"#ff3b30",color:"#fff",border:"2px solid #fff",fontSize:14,cursor:"pointer",lineHeight:"18px",padding:0,fontWeight:700,fontFamily:"inherit"}}>×</button></span>))}</div>)}
    <div style={{padding:"16px 24px max(env(safe-area-inset-bottom),16px)",background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
      <button type="button" onClick={()=>setFacing(f=>f==="environment"?"user":"environment")} disabled={!!error||busy||finishing} aria-label="Alternar câmera frontal/traseira" style={{background:"rgba(255,255,255,0.15)",color:"#fff",border:"none",borderRadius:"50%",width:48,height:48,fontSize:22,cursor:"pointer",fontFamily:"inherit",opacity:error?0.4:1}}>🔄</button>
      <button type="button" onClick={capture} disabled={busy||finishing||!!error} aria-label="Capturar foto" style={{background:"#fff",border:"4px solid rgba(255,255,255,0.4)",borderRadius:"50%",width:78,height:78,cursor:(busy||finishing||error)?"default":"pointer",boxShadow:"inset 0 0 0 4px #000",opacity:(busy||finishing||error)?0.4:1,fontFamily:"inherit",padding:0}}/>
      <div style={{width:48}}/>
    </div>
  </div>);
});
const Cd_=({title,icon,children,styles:st,variant})=>{const isPink=st.accentMode==="pink";const vColors=isPink?{danger:"#ff3b6e",warning:"#ff7a30",info:"#b54d8e",success:"#3fb56b",primary:"#d6336c",teal:"#c73086",slate:"#8a5a72"}:{danger:"#ff3b30",warning:"#ff9500",info:"#5856d6",success:"#34c759",primary:"#007aff",teal:"#30b0c7",slate:"#636e72"};const accent=variant&&vColors[variant]?vColors[variant]:null;const iconKey=(icon||"").trim();const hasSvg=iconKey&&APP_ICONS&&APP_ICONS[iconKey];// Gradiente sutil: do topo (+claro) pro fundo (ligeiramente mais escuro).
// Em dark mode: #1c1c1e → #242428 (elevação sutil). Em light: #ffffff → #fafbfc.
const bgGradient=st.dark?"linear-gradient(180deg,#1f1f22 0%,#141416 100%)":"linear-gradient(180deg,#ffffff 0%,#fafbfc 100%)";
// Sombra normal + glow colorido quando há variant
const baseShadow=st.dark?"0 2px 8px rgba(0,0,0,0.5),0 0 0 0.5px rgba(255,255,255,0.06),inset 0 1px 0 rgba(255,255,255,0.05)":"0 1px 3px rgba(0,0,0,0.06),0 0 0 0.5px rgba(0,0,0,0.04),0 4px 14px rgba(0,0,0,0.04)";
const glowShadow=accent?`${baseShadow},0 0 16px ${accent}22,-2px 0 10px ${accent}18`:baseShadow;
return(<div className="ios-card" style={{background:bgGradient,borderRadius:18,marginBottom:14,overflow:"hidden",boxShadow:glowShadow,position:"relative",transition:"box-shadow 0.3s ease"}}>{accent&&<div style={{position:"absolute",top:0,left:0,bottom:0,width:5,background:`linear-gradient(180deg,${accent} 0%,${accent}aa 50%,${accent}66 100%)`,borderTopLeftRadius:18,borderBottomLeftRadius:18,boxShadow:`0 0 8px ${accent}55`}}/>}<div style={{padding:"16px 20px 10px 22px",display:"flex",alignItems:"center",gap:10}}>{icon&&(hasSvg?<AppIcon name={iconKey} size={30} mr={0}/>:<span style={{fontSize:22,lineHeight:1}}>{icon}</span>)}<span style={{fontSize:19,fontWeight:800,color:st.tx,letterSpacing:-0.4,lineHeight:1.15}}>{title}</span></div><div style={{padding:"0 20px 18px 22px"}}>{children}</div></div>);};
// EmptyState ilustrativo (estilo iOS / Apple Health)
const EmptyState=({icon,title,hint,accent="#007aff",dark:isDark})=>{const grad=`url(#emptyGrad-${accent.replace("#","")})`;return(<div style={{padding:"28px 20px",textAlign:"center",background:isDark?"linear-gradient(180deg,rgba(255,255,255,0.02) 0%,transparent 100%)":"linear-gradient(180deg,rgba(0,0,0,0.015) 0%,transparent 100%)",borderRadius:14,marginBottom:10,border:`1.5px dashed ${accent}33`}}><svg width="64" height="64" viewBox="0 0 64 64" style={{marginBottom:10,filter:`drop-shadow(0 2px 6px ${accent}30)`}}><defs><linearGradient id={`emptyGrad-${accent.replace("#","")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity="0.18"/><stop offset="100%" stopColor={accent} stopOpacity="0.04"/></linearGradient></defs><circle cx="32" cy="32" r="28" fill={grad} stroke={accent+"55"} strokeWidth="1.2"/><text x="32" y="42" textAnchor="middle" fontSize="28">{icon}</text></svg><div style={{fontSize:15,fontWeight:700,color:isDark?"#fff":"#000",letterSpacing:-0.3,marginBottom:4}}>{title}</div>{hint&&<div style={{fontSize:12,color:isDark?"#999":"#666",lineHeight:1.5}}>{hint}</div>}</div>);};
const Rg_=({id,x,y,w,h,n,count,onClick})=>{const c=count;const fs=Math.max(6,Math.min(9,w/((n||"").length||1)*1.5));return(<g onClick={()=>onClick(id)} style={{cursor:"pointer"}}><rect x={x} y={y} width={w} height={h} fill={c?"rgba(255,59,48,0.25)":"rgba(0,80,220,0.09)"} stroke={c?"#ff3b30":"#7788aa"} strokeWidth={c?2:0.9} strokeDasharray={c?"":"4,2"} rx="3"/>{n&&<text x={x+w/2} y={y+h/2+fs/3} textAnchor="middle" fontSize={fs} fontWeight="600" fill={c?"#cc0000":"#335"}>{n}</text>}{c>0&&<><circle cx={x+w-6} cy={y+6} r="7" fill="#ff3b30"/><text x={x+w-6} y={y+9.5} textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff">{c}</text></>}</g>);};
// Vehicle SVG region
const VRg=({id,x,y,w,h,n,count,onClick})=>{const c=count;const fs=Math.max(6.5,Math.min(9.5,w/n.length*1.6));return(<g onClick={()=>onClick(id,n)} style={{cursor:"pointer"}}><rect x={x} y={y} width={w} height={h} fill={c?"rgba(255,59,48,0.25)":"rgba(0,80,220,0.09)"} stroke={c?"#ff3b30":"#7788aa"} strokeWidth={c?2:0.9} strokeDasharray={c?"":"4,2"} rx="3"/><text x={x+w/2} y={y+h/2+fs/3} textAnchor="middle" fontSize={fs} fontWeight="600" fill={c?"#cc0000":"#335"}>{n}</text>{c>0&&<><circle cx={x+w-7} cy={y+7} r="8" fill="#ff3b30"/><text x={x+w-7} y={y+10.5} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#fff">{c}</text></>}</g>);};


// ════════════════════════════════════════════════════════════════
// TEMPLATES POR NATUREZA + LOCAL DO FATO
// Fluxo: (1) tipo de ocorrência, (2) local do fato
// Campos pré-preenchidos e vestígios sugeridos são ajustáveis.
// Projeção usa fluxo especial: pula menu de local e cria
// edificação tipo "Apartamento" diretamente.
// ════════════════════════════════════════════════════════════════
const TEMPLATES=[
  {
    id:"homicidio_paf",
    icon:"🔫",
    label:"Homicídio por arma de fogo",
    description:"PAF — via pública ou residência",
    data:{nat:"Homicídio",c0_dg:"Homicídio",c0_sx:"Masculino",c0_ins:["Arma de fogo"],c0_le:"Local examinado",c0_mom:"Recente"},
    vestigios:[
      {desc:"Cartucho deflagrado",obs:"Confirmar calibre"},
      {desc:"Projétil",obs:""}
    ]
  },
  {
    id:"homicidio_branca",
    icon:"🔪",
    label:"Homicídio arma branca",
    description:"Perfurocortante, cortante ou corto-contundente",
    data:{nat:"Homicídio",c0_dg:"Homicídio",c0_sx:"Masculino",c0_ins:["Inst. ação cortante","Inst. ação corto-cont."],c0_le:"Local examinado",c0_mom:"Recente"},
    vestigios:[
      {desc:"Instrumento (faca/canivete/similar)",obs:""},
      {desc:"Sangue",obs:"Avaliar padrão de distribuição"}
    ]
  },
  {
    id:"feminicidio_paf",
    icon:"🔫♀️",
    label:"Feminicídio por arma de fogo",
    description:"PAF — vítima do sexo feminino",
    data:{nat:"Feminicídio",c0_dg:"Homicídio",c0_sx:"Feminino",c0_ins:["Arma de fogo"],c0_le:"Local examinado",c0_mom:"Recente"},
    vestigios:[
      {desc:"Cartucho deflagrado",obs:"Confirmar calibre"},
      {desc:"Projétil",obs:""}
    ]
  },
  {
    id:"feminicidio_branca",
    icon:"🔪♀️",
    label:"Feminicídio arma branca",
    description:"Perfurocortante/cortante — vítima feminina",
    data:{nat:"Feminicídio",c0_dg:"Homicídio",c0_sx:"Feminino",c0_ins:["Inst. ação cortante","Inst. ação corto-cont."],c0_le:"Local examinado",c0_mom:"Recente"},
    vestigios:[
      {desc:"Instrumento (faca/canivete/similar)",obs:""},
      {desc:"Sangue",obs:"Avaliar padrão de distribuição"}
    ]
  },
  {
    id:"tentativa_homicidio",
    icon:"⚠️",
    label:"Tentativa de homicídio",
    description:"Vítima viva — documentação do local",
    data:{nat:"Tentativa de homicídio",c0_dg:"A esclarecer",c0_le:"Local examinado",c0_mom:"Recente"},
    vestigios:[
      {desc:"Sangue",obs:"Avaliar padrão; possível trilha se vítima se deslocou"}
    ]
  },
  {
    id:"suicidio_enforc",
    icon:"🪢",
    label:"Suicídio por enforcamento",
    description:"Forca — ponto de suspensão e nó",
    data:{nat:"Suicídio",c0_dg:"Suicídio",c0_ins:["Inst. const. semi-ríg."],c0_le:"Local examinado",c0_mom:"Recente",c0_sui_tipo:"Forca"},
    vestigios:[
      {desc:"Instrumento de suspensão (corda/fio/cinto)",obs:"Medir comprimento; descrever nó"}
    ]
  },
  {
    id:"suicidio_paf",
    icon:"🔫🪦",
    label:"Suicídio por arma de fogo",
    description:"PAF autoinfligido",
    data:{nat:"Suicídio",c0_dg:"Suicídio",c0_ins:["Arma de fogo"],c0_le:"Local examinado",c0_mom:"Recente",c0_sui_tipo:"Arma de fogo"},
    vestigios:[
      {desc:"Arma de fogo",obs:"Descrever posição em relação ao cadáver"},
      {desc:"Cartucho deflagrado",obs:""},
      {desc:"Projétil",obs:"Se não retido no cadáver"}
    ]
  },
  {
    id:"suicidio_projecao",
    icon:"🏙️",
    label:"Suicídio por projeção",
    description:"Queda de altura — apartamento/prédio",
    data:{nat:"Suicídio",c0_dg:"Suicídio",c0_le:"Local examinado",c0_mom:"Recente",c0_sui_tipo:"Projeção"},
    vestigios:[],
    forceLocal:"apartamento"
  },
  {
    id:"afogamento",
    icon:"💧",
    label:"Afogamento",
    description:"Meio líquido — rio, piscina, banheira",
    data:{nat:"Afogado",c0_dg:"Afogamento",c0_le:"A esclarecer",c0_mom:"A esclarecer"},
    vestigios:[]
  },
  {
    id:"man",
    icon:"❓",
    label:"MAN (Morte Aparentemente Natural)",
    description:"Sem sinais externos de violência",
    data:{nat:"Cadáver encontrado",c0_dg:"MAN",c0_le:"Local examinado",c0_mom:"A esclarecer"},
    vestigios:[]
  }
];

// ────────────────────────────────────────────────────────────
// LOCAIS — pré-preenchimento de campos do Local do fato
// ────────────────────────────────────────────────────────────
const LOCAIS=[
  {
    id:"via_publica",
    icon:"🛣️",
    label:"Via pública",
    description:"Rua, estrada, calçada, logradouro",
    baseData:{tp:"Via pública",area:"Urbana"},
    createEdificacao:false,
    createTrilha:false
  },
  {
    id:"residencia",
    icon:"🏠",
    label:"Residência",
    description:"Casa, apartamento, área privada",
    baseData:{tp:"Edificação",dest:"Residencial",area:"Urbana"},
    createEdificacao:true,
    edificacaoTipo:"",
    createTrilha:false
  },
  {
    id:"ambos",
    icon:"🔀",
    label:"Via pública e residência",
    description:"Fato envolveu via e residência (trilha de sangue)",
    baseData:{tp:"Via pública",dest:"Residencial",area:"Urbana"},
    createEdificacao:true,
    edificacaoTipo:"",
    createTrilha:true
  },
  {
    id:"apartamento",
    icon:"🏢",
    label:"Apartamento",
    description:"Para projeção — edificação com andares",
    baseData:{tp:"Edificação",dest:"Residencial",area:"Urbana"},
    createEdificacao:true,
    edificacaoTipo:"Apartamento",
    createTrilha:false,
    hidden:true
  }
];

// ────────────────────────────────────────────────────────────
// VESTÍGIOS EXTRAS POR COMBINAÇÃO template × local
// Complementa os vestígios base do template
// ────────────────────────────────────────────────────────────
const VESTIGIOS_EXTRAS={
  "homicidio_paf":{
    "via_publica":[{desc:"Sangue (asfalto)",obs:""}],
    "residencia":[
      {desc:"Sangue (piso/paredes/móveis)",obs:"Avaliar padrão"}
    ],
    "ambos":[{desc:"Sangue (trilha entre via e interior)",obs:"Documentar trajeto"}]
  },
  "homicidio_branca":{
    "via_publica":[{desc:"Sangue (asfalto)",obs:""}],
    "residencia":[{desc:"Objetos deslocados (sinais de luta)",obs:""}],
    "ambos":[{desc:"Sangue (trilha entre via e interior)",obs:""}]
  },
  "feminicidio_paf":{
    "via_publica":[{desc:"Sangue (asfalto)",obs:""}],
    "residencia":[
      {desc:"Sangue (piso/paredes/móveis)",obs:"Avaliar padrão"}
    ],
    "ambos":[{desc:"Sangue (trilha entre via e interior)",obs:""}]
  },
  "feminicidio_branca":{
    "via_publica":[{desc:"Sangue (asfalto)",obs:""}],
    "residencia":[{desc:"Objetos deslocados (sinais de luta)",obs:""}],
    "ambos":[{desc:"Sangue (trilha entre via e interior)",obs:""}]
  },
  "tentativa_homicidio":{
    "via_publica":[],
    "residencia":[{desc:"Objetos deslocados (sinais de luta)",obs:""}],
    "ambos":[{desc:"Sangue (trilha indicando deslocamento da vítima)",obs:""}]
  },
  "suicidio_enforc":{
    "via_publica":[],
    "residencia":[
      {desc:"Ponto de ancoragem",obs:"Descrever altura e material"},
      {desc:"Objeto usado como apoio (se houver)",obs:"Ex: banco, cadeira"}
    ],
    "ambos":[]
  },
  "suicidio_paf":{
    "via_publica":[],
    "residencia":[],
    "ambos":[]
  },
  "afogamento":{
    "via_publica":[{desc:"Vestes e pertences da vítima",obs:""}],
    "residencia":[{desc:"Meio líquido (piscina/banheira)",obs:"Profundidade, características"}],
    "ambos":[]
  },
  "man":{
    "via_publica":[],
    "residencia":[{desc:"Medicações em uso",obs:""}],
    "ambos":[]
  }
};

// ════════════════════════════════════════════════════════════════
// ERROR BOUNDARY — Recuperação graciosa de erros
// ════════════════════════════════════════════════════════════════
class TabErrorBoundary extends React.Component{constructor(p){super(p);this.state={hasError:false,error:null};}static getDerivedStateFromError(e){return{hasError:true,error:e};}componentDidCatch(e,info){console.error("CQ TabError:",e,info);}render(){if(this.state.hasError)return(<div style={{padding:24,textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}>⚠️</div><div style={{fontSize:15,fontWeight:700,marginBottom:8}}>Erro nesta aba</div><p style={{fontSize:12,color:"#888",marginBottom:16}}>{String(this.state.error?.message||"Erro desconhecido").slice(0,120)}</p><button type="button" onClick={()=>this.setState({hasError:false,error:null})} style={{padding:"10px 24px",fontSize:14,fontWeight:600,borderRadius:10,border:"none",background:"#007aff",color:"#fff",cursor:"pointer"}}><AppIcon name="🔄" size={14} mr={4}/>Tentar novamente</button></div>);return this.props.children;}}

// ════════════════════════════════════════════════════════════════
// TAB ICONS — SVG customizados estilo Xandroid (caveira)
// ════════════════════════════════════════════════════════════════
// Cada emoji das 7 tabs tem um SVG correspondente em estilo consistente:
// fundo circular gradiente azul-marinho, glyph branco-cinza, detalhe azul ciano.
const APP_ICONS={
"📋":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg0" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg0)"/><rect x="32" y="26" width="36" height="48" rx="3" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="40" y="22" width="20" height="8" rx="2" fill="#5ac8fa"/><line x1="38" y1="40" x2="62" y2="40" stroke="#8e8e93" strokeWidth="1.5"/><line x1="38" y1="48" x2="62" y2="48" stroke="#8e8e93" strokeWidth="1.5"/><line x1="38" y1="56" x2="55" y2="56" stroke="#8e8e93" strokeWidth="1.5"/><line x1="38" y1="64" x2="58" y2="64" stroke="#8e8e93" strokeWidth="1.5"/></svg>),
"📍":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg1" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg1)"/><path d="M50 22 C38 22 30 30 30 42 C30 56 50 76 50 76 C50 76 70 56 70 42 C70 30 62 22 50 22 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="50" cy="42" r="7" fill="#5ac8fa"/></svg>),
"🧪":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg2" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient><linearGradient id="apg2L" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#7ad6fb"/><stop offset="100%" stopColor="#2aa8e0"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg2)"/><path d="M38 20 L62 20 L62 28 L58 28 L58 72 A10 10 0 0 1 42 72 L42 28 L38 28 Z" fill="#ffffff" stroke="#0a2540" strokeWidth="1.5"/><path d="M42 50 L58 50 L58 72 A10 10 0 0 1 42 72 Z" fill="url(#apg2L)"/><ellipse cx="50" cy="52" rx="8" ry="1.5" fill="#ffffff" opacity="0.6"/><circle cx="48" cy="64" r="1.8" fill="#ffffff" opacity="0.8"/><circle cx="53" cy="60" r="1.2" fill="#ffffff" opacity="0.7"/><circle cx="51" cy="68" r="1" fill="#ffffff" opacity="0.6"/></svg>),
"🏥":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg3" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg3)"/><path d="M50 22 C36 22 26 32 26 47 C26 57 31 64 38 68 L38 76 Q38 80 42 80 L44 80 L44 78 C44 76 45 75 47 75 C49 75 50 76 50 78 L50 80 L56 80 L56 78 C56 76 57 75 59 75 C61 75 62 76 62 78 L62 80 L64 80 Q68 80 68 76 L68 68 C75 64 80 57 80 47 C80 32 70 22 56 22 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><ellipse cx="41" cy="48" rx="6" ry="7" fill="#0a2540"/><ellipse cx="61" cy="48" rx="6" ry="7" fill="#0a2540"/><circle cx="39" cy="45" r="1.4" fill="#5ac8fa"/><circle cx="59" cy="45" r="1.4" fill="#5ac8fa"/><path d="M51 56 L48 64 L51 66 L54 64 Z" fill="#0a2540"/></svg>),
"🚗":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg4" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg4)"/><path d="M24 58 L30 44 Q32 40 37 40 L63 40 Q68 40 70 44 L76 58 L76 66 Q76 68 74 68 L72 68 Q72 72 68 72 Q64 72 64 68 L36 68 Q36 72 32 72 Q28 72 28 68 L26 68 Q24 68 24 66 Z" fill="#ffffff" stroke="#0a2540" strokeWidth="1.8"/><path d="M32 56 L34 46 Q35 44 38 44 L62 44 Q65 44 66 46 L68 56 Z" fill="#5ac8fa"/><line x1="50" y1="44" x2="50" y2="56" stroke="#ffffff" strokeWidth="1.5" opacity="0.8"/><circle cx="33" cy="66" r="5" fill="#0a2540" stroke="#ffffff" strokeWidth="1.5"/><circle cx="33" cy="66" r="2" fill="#a1a1a6"/><circle cx="67" cy="66" r="5" fill="#0a2540" stroke="#ffffff" strokeWidth="1.5"/><circle cx="67" cy="66" r="2" fill="#a1a1a6"/><rect x="26" y="56" width="4" height="3" rx="1" fill="#ffcc00"/><rect x="70" y="56" width="4" height="3" rx="1" fill="#ffcc00"/></svg>),
"💾":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg5" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg5)"/><path d="M50 24 L50 58" stroke="#f8f8fa" strokeWidth="5" strokeLinecap="round"/><path d="M36 48 L50 62 L64 48" fill="none" stroke="#5ac8fa" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><rect x="28" y="68" width="44" height="8" rx="2" fill="#f8f8fa"/></svg>),
"✏️":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg6" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg6)"/><path d="M62 24 L74 36 L38 72 L26 76 L30 64 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M62 24 L74 36 L68 42 L56 30 Z" fill="#5ac8fa"/><path d="M30 64 L26 76 L38 72 Z" fill="#0a2540"/></svg>),
"🏢":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg7" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg7)"/><rect x="30" y="26" width="40" height="54" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="34" y="32" width="6" height="6" fill="#5ac8fa"/><rect x="44" y="32" width="6" height="6" fill="#5ac8fa"/><rect x="54" y="32" width="6" height="6" fill="#5ac8fa"/><rect x="34" y="42" width="6" height="6" fill="#5ac8fa"/><rect x="44" y="42" width="6" height="6" fill="#5ac8fa"/><rect x="54" y="42" width="6" height="6" fill="#5ac8fa"/><rect x="34" y="52" width="6" height="6" fill="#5ac8fa"/><rect x="44" y="52" width="6" height="6" fill="#5ac8fa"/><rect x="54" y="52" width="6" height="6" fill="#5ac8fa"/><rect x="44" y="66" width="12" height="14" fill="#0a2540"/></svg>),
"📷":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg8" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg8)"/><path d="M20 38 L30 38 L34 30 L66 30 L70 38 L80 38 Q82 38 82 40 L82 72 Q82 74 80 74 L20 74 Q18 74 18 72 L18 40 Q18 38 20 38 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="50" cy="54" r="13" fill="#0a2540"/><circle cx="50" cy="54" r="9" fill="#5ac8fa" opacity="0.85"/><circle cx="46" cy="50" r="3" fill="#fff" opacity="0.7"/><circle cx="72" cy="43" r="2" fill="#5ac8fa"/></svg>),
"☠️":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg9" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg9)"/><path d="M50 22 C36 22 26 32 26 47 C26 57 31 64 38 68 L38 74 L44 74 L44 72 C44 70 46 69 48 69 C50 69 52 70 52 72 L52 74 L58 74 L58 72 C58 70 60 69 62 69 C64 69 66 70 66 72 L66 74 L72 74 L72 68 C79 64 84 57 84 47 C84 32 74 22 60 22 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><ellipse cx="41" cy="48" rx="6" ry="7" fill="#0a2540"/><ellipse cx="59" cy="48" rx="6" ry="7" fill="#0a2540"/><path d="M48 56 L45 64 L50 66 L55 64 L52 56 Z" fill="#0a2540"/><path d="M20 82 L80 82 M22 78 L26 86 M78 78 L74 86 M20 78 L24 86 M76 78 L80 86" stroke="#f8f8fa" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/></svg>),
"💀":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg10" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg10)"/><path d="M50 22 C36 22 26 32 26 47 C26 57 31 64 38 68 L38 76 Q38 80 42 80 L44 80 L44 78 C44 76 45 75 47 75 C49 75 50 76 50 78 L50 80 L56 80 L56 78 C56 76 57 75 59 75 C61 75 62 76 62 78 L62 80 L64 80 Q68 80 68 76 L68 68 C75 64 80 57 80 47 C80 32 70 22 56 22 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><ellipse cx="41" cy="48" rx="6" ry="7" fill="#0a2540"/><ellipse cx="61" cy="48" rx="6" ry="7" fill="#0a2540"/><circle cx="39" cy="45" r="1.4" fill="#5ac8fa"/><circle cx="59" cy="45" r="1.4" fill="#5ac8fa"/><path d="M51 56 L48 64 L51 66 L54 64 Z" fill="#0a2540"/></svg>),
"👤":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg11" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg11)"/><circle cx="50" cy="38" r="12" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M26 82 C26 68 38 58 50 58 C62 58 74 68 74 82 L74 84 L26 84 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="50" cy="38" r="3" fill="#5ac8fa" opacity="0.4"/></svg>),
"👥":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg12" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg12)"/><circle cx="34" cy="40" r="9" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="62" cy="38" r="10" fill="#5ac8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M18 76 C18 66 26 58 34 58 C40 58 45 62 48 66 L48 80 L18 80 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M44 80 C44 68 52 58 62 58 C74 58 82 68 82 80 L82 82 L44 82 Z" fill="#5ac8fa" opacity="0.85" stroke="#a1a1a6" strokeWidth="1"/></svg>),
"👔":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg13" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg13)"/><path d="M36 22 L50 30 L64 22 L72 34 L72 82 L28 82 L28 34 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M44 22 L50 40 L56 22 L50 30 Z" fill="#5ac8fa"/><circle cx="50" cy="50" r="2" fill="#0a2540"/><circle cx="50" cy="60" r="2" fill="#0a2540"/><circle cx="50" cy="70" r="2" fill="#0a2540"/></svg>),
"🏠":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg14" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg14)"/><path d="M50 22 L78 44 L78 80 L22 80 L22 44 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M50 22 L20 44 L22 46 L50 26 L78 46 L80 44 Z" fill="#5ac8fa"/><rect x="42" y="58" width="16" height="22" fill="#0a2540"/><rect x="30" y="52" width="8" height="8" fill="#5ac8fa" opacity="0.7"/><rect x="62" y="52" width="8" height="8" fill="#5ac8fa" opacity="0.7"/></svg>),
"🏘️":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg15" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg15)"/><path d="M18 80 L18 50 L36 36 L54 50 L54 80 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M46 80 L46 56 L62 42 L78 56 L78 80 Z" fill="#5ac8fa" opacity="0.85" stroke="#a1a1a6" strokeWidth="1"/><rect x="28" y="62" width="6" height="10" fill="#0a2540"/><rect x="60" y="66" width="6" height="10" fill="#0a2540"/></svg>),
"🌳":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg16" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg16)"/><ellipse cx="50" cy="40" rx="22" ry="20" fill="#5ac8fa" opacity="0.9" stroke="#a1a1a6" strokeWidth="1"/><ellipse cx="36" cy="46" rx="10" ry="10" fill="#5ac8fa" opacity="0.75"/><ellipse cx="64" cy="46" rx="10" ry="10" fill="#5ac8fa" opacity="0.75"/><rect x="46" y="58" width="8" height="24" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/></svg>),
"🛤️":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg17" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg17)"/><path d="M32 20 L24 82" stroke="#f8f8fa" strokeWidth="4" strokeLinecap="round"/><path d="M68 20 L76 82" stroke="#f8f8fa" strokeWidth="4" strokeLinecap="round"/><rect x="26" y="30" width="48" height="3" fill="#5ac8fa"/><rect x="26" y="46" width="48" height="3" fill="#5ac8fa"/><rect x="26" y="62" width="48" height="3" fill="#5ac8fa"/></svg>),
"🛣️":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg18" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg18)"/><path d="M38 20 L30 82 L70 82 L62 20 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M50 24 L50 30 M50 40 L50 48 M50 58 L50 66 M50 76 L50 82" stroke="#5ac8fa" strokeWidth="3" strokeLinecap="round"/></svg>),
"📄":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg19" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg19)"/><path d="M30 20 L58 20 L72 34 L72 82 L30 82 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M58 20 L58 34 L72 34 Z" fill="#5ac8fa"/><line x1="38" y1="44" x2="64" y2="44" stroke="#8e8e93" strokeWidth="1.8"/><line x1="38" y1="54" x2="64" y2="54" stroke="#8e8e93" strokeWidth="1.8"/><line x1="38" y1="64" x2="56" y2="64" stroke="#8e8e93" strokeWidth="1.8"/><line x1="38" y1="74" x2="60" y2="74" stroke="#8e8e93" strokeWidth="1.8"/></svg>),
"📂":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg20" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg20)"/><path d="M20 32 L40 32 L46 38 L80 38 L80 76 L20 76 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M22 44 L78 44 L74 78 L26 78 Z" fill="#5ac8fa" opacity="0.7" stroke="#a1a1a6" strokeWidth="0.5"/></svg>),
"📝":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg21" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg21)"/><rect x="26" y="22" width="44" height="56" rx="2" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="24" y="30" width="8" height="3" fill="#5ac8fa"/><rect x="24" y="42" width="8" height="3" fill="#5ac8fa"/><rect x="24" y="54" width="8" height="3" fill="#5ac8fa"/><rect x="24" y="66" width="8" height="3" fill="#5ac8fa"/><line x1="36" y1="36" x2="62" y2="36" stroke="#8e8e93" strokeWidth="1.5"/><line x1="36" y1="46" x2="62" y2="46" stroke="#8e8e93" strokeWidth="1.5"/><line x1="36" y1="56" x2="58" y2="56" stroke="#8e8e93" strokeWidth="1.5"/><line x1="36" y1="66" x2="54" y2="66" stroke="#8e8e93" strokeWidth="1.5"/><path d="M68 64 L76 56 L82 62 L74 70 Z" fill="#5ac8fa"/><path d="M68 64 L74 70 L70 74 L64 68 Z" fill="#0a2540"/></svg>),
"🏷️":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg22" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg22)"/><path d="M24 38 L52 24 L80 38 L80 58 L52 76 L24 58 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="36" cy="44" r="5" fill="#0a2540"/><circle cx="36" cy="44" r="2" fill="#5ac8fa"/><text x="56" y="54" fontFamily="-apple-system" fontSize="12" fontWeight="800" fill="#0a2540">42</text></svg>),
"🖼️":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg23" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg23)"/><rect x="22" y="26" width="56" height="44" rx="2" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="26" y="30" width="48" height="36" fill="#5ac8fa" opacity="0.3"/><circle cx="38" cy="42" r="5" fill="#5ac8fa"/><path d="M28 62 L40 50 L52 58 L64 44 L72 60 L72 66 L28 66 Z" fill="#0a2540"/></svg>),
"🔍":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg24" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg24)"/><circle cx="42" cy="42" r="18" fill="none" stroke="#f8f8fa" strokeWidth="5"/><circle cx="42" cy="42" r="14" fill="#5ac8fa" opacity="0.4"/><path d="M56 56 L74 74" stroke="#f8f8fa" strokeWidth="6" strokeLinecap="round"/></svg>),
"🔒":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg25" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg25)"/><path d="M36 42 L36 34 C36 26 42 20 50 20 C58 20 64 26 64 34 L64 42" fill="none" stroke="#f8f8fa" strokeWidth="5" strokeLinecap="round"/><rect x="28" y="42" width="44" height="38" rx="4" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="50" cy="58" r="5" fill="#5ac8fa"/><rect x="48" y="60" width="4" height="10" fill="#5ac8fa"/></svg>),
"🔬":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg26" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg26)"/><rect x="46" y="22" width="12" height="26" rx="2" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="52" cy="48" r="6" fill="#5ac8fa"/><rect x="40" y="54" width="20" height="4" fill="#f8f8fa"/><rect x="30" y="68" width="44" height="6" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="36" y="58" width="28" height="12" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/></svg>),
"🗺️":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg27" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg27)"/><path d="M20 26 L40 22 L60 28 L80 24 L80 74 L60 78 L40 72 L20 76 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M40 22 L40 72 M60 28 L60 78" stroke="#8e8e93" strokeWidth="1"/><circle cx="50" cy="50" r="5" fill="#5ac8fa"/><path d="M50 50 L46 42 L54 42 Z" fill="#5ac8fa"/></svg>),
"🚦":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg28" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg28)"/><rect x="38" y="20" width="24" height="62" rx="4" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="50" cy="34" r="6" fill="#d12822"/><circle cx="50" cy="50" r="6" fill="#8a5a00"/><circle cx="50" cy="66" r="6" fill="#1f7a30"/></svg>),
"🛰️":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg29" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg29)"/><rect x="42" y="42" width="16" height="16" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="20" y="44" width="20" height="12" fill="#5ac8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="60" y="44" width="20" height="12" fill="#5ac8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M50 42 L50 26" stroke="#f8f8fa" strokeWidth="2"/><circle cx="50" cy="22" r="3" fill="#5ac8fa"/><path d="M38 28 Q50 18 62 28" fill="none" stroke="#5ac8fa" strokeWidth="1.5" strokeDasharray="2 2"/></svg>),
"🖐️":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg30" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg30)"/><path d="M32 56 L32 40 Q32 36 36 36 Q40 36 40 40 L40 22 Q40 18 44 18 Q48 18 48 22 L48 24 Q48 20 52 20 Q56 20 56 24 L56 26 Q56 22 60 22 Q64 22 64 26 L64 30 Q64 26 68 26 Q72 26 72 30 L72 60 C72 72 62 82 50 82 C40 82 32 76 32 68 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="52" cy="60" r="5" fill="#5ac8fa" opacity="0.6"/></svg>),
"🩸":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg31" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg31)"/><path d="M50 18 C50 18 30 46 30 60 C30 72 39 82 50 82 C61 82 70 72 70 60 C70 46 50 18 50 18 Z" fill="#d12822" stroke="#a1a1a6" strokeWidth="1"/><ellipse cx="44" cy="52" rx="5" ry="10" fill="#ff6b6b" opacity="0.6"/></svg>),
"🩹":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg32" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg32)"/><g transform="rotate(-30 50 50)"><rect x="20" y="40" width="60" height="20" rx="10" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="36" y="44" width="28" height="12" fill="#5ac8fa" opacity="0.8"/><circle cx="42" cy="48" r="1.5" fill="#0a2540"/><circle cx="50" cy="50" r="1.5" fill="#0a2540"/><circle cx="58" cy="52" r="1.5" fill="#0a2540"/></g></svg>),
"🧽":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg33" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg33)"/><rect x="22" y="34" width="56" height="36" rx="4" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="22" y="34" width="56" height="18" rx="4" fill="#5ac8fa" opacity="0.6"/><circle cx="30" cy="44" r="2" fill="#0a2540" opacity="0.4"/><circle cx="40" cy="42" r="1.5" fill="#0a2540" opacity="0.4"/><circle cx="52" cy="46" r="2" fill="#0a2540" opacity="0.4"/><circle cx="62" cy="42" r="1.5" fill="#0a2540" opacity="0.4"/><circle cx="70" cy="46" r="2" fill="#0a2540" opacity="0.4"/><circle cx="32" cy="60" r="1.5" fill="#0a2540" opacity="0.4"/><circle cx="46" cy="62" r="1.5" fill="#0a2540" opacity="0.4"/><circle cx="58" cy="58" r="1.5" fill="#0a2540" opacity="0.4"/><circle cx="68" cy="62" r="1.5" fill="#0a2540" opacity="0.4"/></svg>),
"📊":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apg34" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apg34)"/><rect x="22" y="22" width="56" height="60" rx="3" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="30" y="54" width="8" height="20" fill="#5ac8fa"/><rect x="42" y="44" width="8" height="30" fill="#5ac8fa"/><rect x="54" y="34" width="8" height="40" fill="#5ac8fa"/><rect x="66" y="50" width="8" height="24" fill="#5ac8fa"/><line x1="28" y1="28" x2="28" y2="78" stroke="#0a2540" strokeWidth="1.5"/><line x1="28" y1="78" x2="76" y2="78" stroke="#0a2540" strokeWidth="1.5"/></svg>)
,
"✅":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn0" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn0)"/><circle cx="50" cy="50" r="30" fill="#1f7a30" stroke="#a1a1a6" strokeWidth="1"/><path d="M36 50 L46 60 L64 42" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
"❌":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn1" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn1)"/><circle cx="50" cy="50" r="30" fill="#d12822" stroke="#a1a1a6" strokeWidth="1"/><path d="M38 38 L62 62 M62 38 L38 62" stroke="#fff" strokeWidth="6" strokeLinecap="round"/></svg>),
"⚠":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn2" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn2)"/><path d="M50 22 L80 74 L20 74 Z" fill="#ffcc00" stroke="#a1a1a6" strokeWidth="1"/><rect x="48" y="40" width="4" height="18" rx="2" fill="#0a2540"/><circle cx="50" cy="66" r="2.5" fill="#0a2540"/></svg>),
"✓":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn3" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn3)"/><path d="M30 52 L44 66 L70 36" fill="none" stroke="#5ac8fa" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
"✕":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn4" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn4)"/><path d="M32 32 L68 68 M68 32 L32 68" stroke="#f8f8fa" strokeWidth="8" strokeLinecap="round"/></svg>),
"✗":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn5" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn5)"/><path d="M32 32 L68 68 M68 32 L32 68" stroke="#d12822" strokeWidth="8" strokeLinecap="round"/></svg>),
"✚":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn6" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn6)"/><path d="M50 28 L50 72 M28 50 L72 50" stroke="#1f7a30" strokeWidth="8" strokeLinecap="round"/></svg>),
"🗑":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn7" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn7)"/><rect x="30" y="36" width="40" height="44" rx="3" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="24" y="28" width="52" height="8" rx="2" fill="#5ac8fa"/><rect x="44" y="22" width="12" height="8" rx="2" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><line x1="40" y1="46" x2="40" y2="72" stroke="#8e8e93" strokeWidth="2"/><line x1="50" y1="46" x2="50" y2="72" stroke="#8e8e93" strokeWidth="2"/><line x1="60" y1="46" x2="60" y2="72" stroke="#8e8e93" strokeWidth="2"/></svg>),
"✨":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn8" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn8)"/><path d="M50 18 L54 40 L76 44 L54 48 L50 70 L46 48 L24 44 L46 40 Z" fill="#5ac8fa" stroke="#a1a1a6" strokeWidth="0.5"/><circle cx="24" cy="72" r="3" fill="#f8f8fa"/><circle cx="78" cy="74" r="2.5" fill="#f8f8fa"/><circle cx="22" cy="24" r="2" fill="#f8f8fa"/></svg>),
"🔄":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn9" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn9)"/><path d="M50 20 A30 30 0 1 1 24 40" fill="none" stroke="#f8f8fa" strokeWidth="6" strokeLinecap="round"/><path d="M30 18 L24 40 L46 38" fill="none" stroke="#5ac8fa" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
"📥":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn10" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn10)"/><path d="M50 24 L50 54" stroke="#f8f8fa" strokeWidth="6" strokeLinecap="round"/><path d="M36 44 L50 60 L64 44" fill="none" stroke="#5ac8fa" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/><rect x="22" y="68" width="56" height="10" rx="2" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/></svg>),
"🎤":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn11" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn11)"/><rect x="40" y="18" width="20" height="36" rx="10" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="50" cy="28" r="3" fill="#5ac8fa"/><circle cx="50" cy="40" r="3" fill="#5ac8fa"/><path d="M28 50 Q28 68 50 68 Q72 68 72 50" fill="none" stroke="#f8f8fa" strokeWidth="4" strokeLinecap="round"/><rect x="46" y="68" width="8" height="14" fill="#f8f8fa"/><rect x="36" y="80" width="28" height="4" rx="2" fill="#f8f8fa"/></svg>),
"📱":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn12" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn12)"/><rect x="32" y="18" width="36" height="64" rx="6" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="36" y="26" width="28" height="44" fill="#5ac8fa" opacity="0.85"/><circle cx="50" cy="76" r="2.5" fill="#0a2540"/><rect x="44" y="21" width="12" height="2" rx="1" fill="#8e8e93"/></svg>),
"👆":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn13" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn13)"/><path d="M40 56 L40 24 Q40 20 44 20 Q48 20 48 24 L48 44 L52 44 Q56 44 56 48 L56 50 Q58 50 60 50 Q64 50 64 54 Q66 54 68 56 Q70 58 70 62 L70 74 Q70 82 62 82 L44 82 Q34 82 34 72 L34 64 Q34 60 38 58 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="44" cy="32" r="2.5" fill="#5ac8fa"/></svg>),
"💡":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn14" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn14)"/><path d="M50 22 C38 22 30 32 30 44 C30 52 34 58 40 62 L40 70 L60 70 L60 62 C66 58 70 52 70 44 C70 32 62 22 50 22 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M42 62 Q50 40 58 62" fill="none" stroke="#ffcc00" strokeWidth="2.5"/><rect x="40" y="70" width="20" height="6" fill="#5ac8fa"/><rect x="42" y="76" width="16" height="4" fill="#0a2540"/></svg>),
"🧹":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn15" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn15)"/><rect x="56" y="20" width="8" height="30" fill="#8b5a2b" stroke="#a1a1a6" strokeWidth="1" transform="rotate(15 60 35)"/><path d="M38 62 L74 50 L78 66 L42 78 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M40 66 L76 54 M42 72 L78 60" stroke="#5ac8fa" strokeWidth="1.5"/></svg>),
"🔥":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn16" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn16)"/><path d="M50 78 C32 78 24 66 24 54 C24 42 34 36 38 28 C40 36 44 38 48 32 C50 24 52 20 56 22 C52 30 58 36 62 40 C68 44 76 50 76 60 C76 70 68 78 50 78 Z" fill="#ff6b35" stroke="#a1a1a6" strokeWidth="1"/><path d="M50 72 C42 72 36 66 36 58 C36 50 42 46 44 42 C46 48 50 50 52 46 C54 50 58 54 60 58 C62 64 60 72 50 72 Z" fill="#ffcc00"/></svg>),
"🔫":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn17" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn17)"/><path d="M22 40 L56 40 L56 52 L66 52 L66 40 L78 40 L78 54 L72 64 L56 64 L56 56 L40 56 L40 68 L26 68 L22 56 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="26" y="44" width="28" height="4" fill="#5ac8fa" opacity="0.85"/><circle cx="70" cy="48" r="2.5" fill="#0a2540"/><rect x="30" y="58" width="6" height="8" fill="#5ac8fa" opacity="0.6"/></svg>),
"🔪":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn18" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn18)"/><path d="M20 42 L60 38 L78 46 L78 54 L60 62 L20 58 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M20 46 L58 44 L58 56 L20 54 Z" fill="#5ac8fa" opacity="0.4"/><rect x="16" y="40" width="6" height="20" rx="1" fill="#8b5a2b"/><line x1="18" y1="46" x2="22" y2="46" stroke="#0a2540" strokeWidth="0.5"/><line x1="18" y1="54" x2="22" y2="54" stroke="#0a2540" strokeWidth="0.5"/></svg>),
"📐":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn19" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn19)"/><path d="M20 20 L80 80 L20 80 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><line x1="30" y1="74" x2="30" y2="80" stroke="#5ac8fa" strokeWidth="1.5"/><line x1="40" y1="74" x2="40" y2="80" stroke="#5ac8fa" strokeWidth="1.5"/><line x1="50" y1="74" x2="50" y2="80" stroke="#5ac8fa" strokeWidth="1.5"/><line x1="60" y1="74" x2="60" y2="80" stroke="#5ac8fa" strokeWidth="1.5"/><line x1="70" y1="74" x2="70" y2="80" stroke="#5ac8fa" strokeWidth="1.5"/><line x1="20" y1="26" x2="26" y2="26" stroke="#5ac8fa" strokeWidth="1.5"/><line x1="20" y1="36" x2="36" y2="36" stroke="#5ac8fa" strokeWidth="1.5"/><line x1="20" y1="46" x2="46" y2="46" stroke="#5ac8fa" strokeWidth="1.5"/><line x1="20" y1="56" x2="56" y2="56" stroke="#5ac8fa" strokeWidth="1.5"/><line x1="20" y1="66" x2="66" y2="66" stroke="#5ac8fa" strokeWidth="1.5"/></svg>),
"📏":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn20" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn20)"/><rect x="16" y="36" width="68" height="28" rx="2" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1" transform="rotate(-15 50 50)"/><g transform="rotate(-15 50 50)"><line x1="22" y1="36" x2="22" y2="48" stroke="#5ac8fa" strokeWidth="1.5"/><line x1="32" y1="36" x2="32" y2="52" stroke="#5ac8fa" strokeWidth="1.5"/><line x1="42" y1="36" x2="42" y2="48" stroke="#5ac8fa" strokeWidth="1.5"/><line x1="52" y1="36" x2="52" y2="52" stroke="#5ac8fa" strokeWidth="1.5"/><line x1="62" y1="36" x2="62" y2="48" stroke="#5ac8fa" strokeWidth="1.5"/><line x1="72" y1="36" x2="72" y2="52" stroke="#5ac8fa" strokeWidth="1.5"/></g></svg>),
"🎨":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn21" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn21)"/><path d="M50 20 C34 20 20 32 20 48 C20 62 30 70 42 68 C40 66 40 60 44 60 L52 60 C60 60 60 52 60 52 C66 52 80 52 80 40 C80 28 66 20 50 20 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="34" cy="38" r="4" fill="#d12822"/><circle cx="46" cy="32" r="4" fill="#ffcc00"/><circle cx="60" cy="36" r="4" fill="#1f7a30"/><circle cx="66" cy="48" r="4" fill="#5ac8fa"/><circle cx="38" cy="52" r="4" fill="#9b4fa8"/></svg>),
"🧍":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn22" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn22)"/><circle cx="50" cy="26" r="10" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="44" y="36" width="12" height="30" rx="2" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="38" y="40" width="6" height="20" rx="2" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="56" y="40" width="6" height="20" rx="2" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="44" y="64" width="5" height="20" rx="2" fill="#5ac8fa"/><rect x="51" y="64" width="5" height="20" rx="2" fill="#5ac8fa"/></svg>),
"🦶":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn23" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn23)"/><path d="M30 30 Q28 24 34 22 Q40 22 40 28 L40 52 Q42 72 52 78 Q70 80 72 64 L72 50 Q72 42 68 38 L58 34 Q50 32 48 28 L46 22 Q42 20 38 22 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="60" cy="38" r="3" fill="#5ac8fa"/><circle cx="66" cy="42" r="2.5" fill="#5ac8fa"/><circle cx="66" cy="50" r="2" fill="#5ac8fa"/><circle cx="64" cy="58" r="1.5" fill="#5ac8fa"/></svg>),
"🔵":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn24" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn24)"/><circle cx="50" cy="50" r="24" fill="#5ac8fa" stroke="#a1a1a6" strokeWidth="1"/></svg>),
"🟢":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn25" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn25)"/><circle cx="50" cy="50" r="24" fill="#1f7a30" stroke="#a1a1a6" strokeWidth="1"/></svg>),
"🟡":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn26" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn26)"/><circle cx="50" cy="50" r="24" fill="#ffcc00" stroke="#a1a1a6" strokeWidth="1"/></svg>),
"🔴":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn27" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn27)"/><circle cx="50" cy="50" r="24" fill="#d12822" stroke="#a1a1a6" strokeWidth="1"/></svg>),
"⚫":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn28" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn28)"/><circle cx="50" cy="50" r="24" fill="#0a2540" stroke="#a1a1a6" strokeWidth="1"/></svg>),
"🛏":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn29" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn29)"/><rect x="20" y="48" width="60" height="24" rx="2" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="18" y="40" width="18" height="14" rx="3" fill="#5ac8fa" opacity="0.85"/><rect x="20" y="72" width="4" height="10" fill="#8e8e93"/><rect x="76" y="72" width="4" height="10" fill="#8e8e93"/><line x1="20" y1="62" x2="80" y2="62" stroke="#8e8e93" strokeWidth="1"/></svg>),
"⚖":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn30" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn30)"/><line x1="50" y1="22" x2="50" y2="78" stroke="#f8f8fa" strokeWidth="3"/><line x1="24" y1="30" x2="76" y2="30" stroke="#f8f8fa" strokeWidth="3"/><path d="M28 30 L20 48 L36 48 Z" fill="#5ac8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M72 30 L64 48 L80 48 Z" fill="#5ac8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="40" y="76" width="20" height="4" fill="#f8f8fa"/><circle cx="50" cy="22" r="3" fill="#f8f8fa"/></svg>),
"💊":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn31" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn31)"/><rect x="22" y="40" width="56" height="20" rx="10" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1" transform="rotate(-20 50 50)"/><rect x="22" y="40" width="28" height="20" rx="10" fill="#5ac8fa" transform="rotate(-20 50 50)"/></svg>),
"♀":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn32" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn32)"/><circle cx="50" cy="40" r="14" fill="none" stroke="#f8f8fa" strokeWidth="5"/><line x1="50" y1="54" x2="50" y2="74" stroke="#f8f8fa" strokeWidth="5" strokeLinecap="round"/><line x1="42" y1="66" x2="58" y2="66" stroke="#f8f8fa" strokeWidth="5" strokeLinecap="round"/></svg>),
"🪢":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn33" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient><linearGradient id="apn33r" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#a87142"/><stop offset="100%" stopColor="#5d3a1c"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn33)"/><path d="M50 12 L50 38" stroke="url(#apn33r)" strokeWidth="5" strokeLinecap="round" fill="none"/><ellipse cx="50" cy="60" rx="22" ry="18" fill="none" stroke="url(#apn33r)" strokeWidth="5"/><rect x="44" y="36" width="12" height="10" rx="2" fill="url(#apn33r)" stroke="#3d2410" strokeWidth="0.6"/><line x1="46" y1="38" x2="46" y2="44" stroke="#3d2410" strokeWidth="0.6"/><line x1="50" y1="38" x2="50" y2="44" stroke="#3d2410" strokeWidth="0.6"/><line x1="54" y1="38" x2="54" y2="44" stroke="#3d2410" strokeWidth="0.6"/></svg>),
"🛋":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn34" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn34)"/><rect x="20" y="44" width="60" height="24" rx="4" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="18" y="38" width="16" height="22" rx="4" fill="#5ac8fa" opacity="0.85"/><rect x="66" y="38" width="16" height="22" rx="4" fill="#5ac8fa" opacity="0.85"/><rect x="34" y="40" width="32" height="10" rx="2" fill="#5ac8fa" opacity="0.6"/><rect x="26" y="68" width="4" height="8" fill="#8e8e93"/><rect x="70" y="68" width="4" height="8" fill="#8e8e93"/></svg>),
"📑":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apn35" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apn35)"/><rect x="22" y="20" width="48" height="58" rx="2" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="30" y="28" width="48" height="58" rx="2" fill="#5ac8fa" opacity="0.85" stroke="#a1a1a6" strokeWidth="1"/><line x1="36" y1="40" x2="66" y2="40" stroke="#0a2540" strokeWidth="1.5"/><line x1="36" y1="50" x2="66" y2="50" stroke="#0a2540" strokeWidth="1.5"/><line x1="36" y1="60" x2="58" y2="60" stroke="#0a2540" strokeWidth="1.5"/></svg>)
,
"🧭":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm0" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm0)"/><circle cx="50" cy="50" r="28" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1.5"/><path d="M50 30 L56 50 L50 70 L44 50 Z" fill="#d12822"/><path d="M50 30 L56 50 L50 50 Z" fill="#fff" stroke="#d12822" strokeWidth="0.5"/><circle cx="50" cy="50" r="3" fill="#0a2540"/><text x="50" y="28" textAnchor="middle" fontSize="9" fontWeight="800" fill="#f8f8fa">N</text></svg>),
"🔤":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm1" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm1)"/><rect x="22" y="28" width="56" height="44" rx="4" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><text x="38" y="60" fontSize="28" fontWeight="800" fill="#0a2540" fontFamily="-apple-system">A</text><text x="54" y="60" fontSize="22" fontWeight="800" fill="#5ac8fa" fontFamily="-apple-system">a</text></svg>),
"🔲":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm2" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm2)"/><rect x="26" y="26" width="48" height="48" rx="4" fill="none" stroke="#f8f8fa" strokeWidth="5"/><rect x="34" y="34" width="32" height="32" rx="2" fill="#5ac8fa" opacity="0.4"/></svg>),
"📸":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm3" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm3)"/><path d="M20 38 L30 38 L34 30 L66 30 L70 38 L80 38 Q82 38 82 40 L82 72 Q82 74 80 74 L20 74 Q18 74 18 72 L18 40 Q18 38 20 38 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="50" cy="54" r="13" fill="#0a2540"/><circle cx="50" cy="54" r="9" fill="#5ac8fa"/><path d="M66 30 L68 24 L74 24 L74 34" fill="#ffcc00" stroke="#a1a1a6" strokeWidth="0.5"/></svg>),
"📦":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm4" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm4)"/><path d="M20 38 L50 24 L80 38 L80 74 L50 86 L20 74 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M20 38 L50 52 L80 38" fill="none" stroke="#a1a1a6" strokeWidth="1"/><path d="M50 52 L50 86" stroke="#a1a1a6" strokeWidth="1"/><rect x="40" y="30" width="20" height="12" fill="#5ac8fa" opacity="0.85"/></svg>),
"🚪":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm5" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm5)"/><rect x="28" y="22" width="44" height="60" rx="2" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="32" y="28" width="36" height="48" fill="#5ac8fa" opacity="0.4"/><circle cx="62" cy="54" r="2.5" fill="#0a2540"/><rect x="26" y="78" width="48" height="4" fill="#8b5a2b"/></svg>),
"🪜":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm6" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm6)"/><rect x="28" y="18" width="4" height="66" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="68" y="18" width="4" height="66" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="28" y="28" width="44" height="4" fill="#5ac8fa"/><rect x="28" y="44" width="44" height="4" fill="#5ac8fa"/><rect x="28" y="60" width="44" height="4" fill="#5ac8fa"/><rect x="28" y="76" width="44" height="4" fill="#5ac8fa"/></svg>),
"🪑":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm7" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm7)"/><rect x="32" y="22" width="36" height="34" rx="2" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="36" y="26" width="28" height="26" fill="#5ac8fa" opacity="0.5"/><rect x="28" y="54" width="44" height="8" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="32" y="62" width="4" height="20" fill="#8e8e93"/><rect x="64" y="62" width="4" height="20" fill="#8e8e93"/></svg>),
"🧤":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm8" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm8)"/><path d="M30 42 L30 26 Q30 22 34 22 Q38 22 38 26 L38 38 L42 38 L42 22 Q42 18 46 18 Q50 18 50 22 L50 38 L54 38 L54 24 Q54 20 58 20 Q62 20 62 24 L62 38 L66 38 L66 30 Q66 26 70 26 Q74 26 74 30 L74 56 C74 70 66 82 52 82 C38 82 30 70 30 58 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M30 56 Q30 68 42 74" fill="none" stroke="#5ac8fa" strokeWidth="1.5"/></svg>),
"🗣":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm9" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm9)"/><circle cx="40" cy="40" r="16" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="36" cy="38" r="2" fill="#0a2540"/><circle cx="44" cy="38" r="2" fill="#0a2540"/><path d="M34 46 Q40 52 46 46" fill="none" stroke="#0a2540" strokeWidth="2" strokeLinecap="round"/><path d="M58 30 Q66 36 66 44 Q66 52 58 58" fill="none" stroke="#5ac8fa" strokeWidth="3" strokeLinecap="round"/><path d="M66 26 Q78 34 78 46 Q78 58 66 66" fill="none" stroke="#5ac8fa" strokeWidth="3" strokeLinecap="round" opacity="0.6"/></svg>),
"🤚":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm10" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm10)"/><path d="M30 60 L30 40 Q30 36 34 36 Q38 36 38 40 L38 22 Q38 18 42 18 Q46 18 46 22 L46 36 L50 36 L50 20 Q50 16 54 16 Q58 16 58 20 L58 36 L62 36 L62 24 Q62 20 66 20 Q70 20 70 24 L70 36 L72 36 Q74 36 74 38 L74 60 Q74 76 58 82 Q38 82 30 72 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="42" cy="52" r="2" fill="#5ac8fa" opacity="0.5"/></svg>),
"✋":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm11" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm11)"/><path d="M30 60 L30 40 Q30 36 34 36 Q38 36 38 40 L38 22 Q38 18 42 18 Q46 18 46 22 L46 36 L50 36 L50 20 Q50 16 54 16 Q58 16 58 20 L58 36 L62 36 L62 24 Q62 20 66 20 Q70 20 70 24 L70 36 L72 36 Q74 36 74 38 L74 60 Q74 76 58 82 Q38 82 30 72 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/></svg>),
"📅":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm12" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm12)"/><rect x="22" y="26" width="56" height="54" rx="4" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="22" y="26" width="56" height="12" fill="#5ac8fa"/><rect x="30" y="20" width="4" height="12" rx="1" fill="#0a2540"/><rect x="66" y="20" width="4" height="12" rx="1" fill="#0a2540"/><circle cx="34" cy="50" r="2" fill="#0a2540"/><circle cx="44" cy="50" r="2" fill="#0a2540"/><circle cx="54" cy="50" r="2" fill="#0a2540"/><circle cx="64" cy="50" r="2" fill="#0a2540"/><circle cx="34" cy="62" r="2" fill="#0a2540"/><circle cx="44" cy="62" r="2" fill="#d12822"/><circle cx="54" cy="62" r="2" fill="#0a2540"/><circle cx="64" cy="62" r="2" fill="#0a2540"/></svg>),
"🕐":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm13" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm13)"/><circle cx="50" cy="50" r="30" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><line x1="50" y1="50" x2="50" y2="30" stroke="#0a2540" strokeWidth="3" strokeLinecap="round"/><line x1="50" y1="50" x2="62" y2="58" stroke="#5ac8fa" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="50" r="2.5" fill="#0a2540"/></svg>),
"🪦":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm14" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm14)"/><path d="M24 36 Q24 20 50 20 Q76 20 76 36 L76 80 L24 80 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><text x="50" y="50" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0a2540">R</text><text x="50" y="66" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0a2540">I P</text><rect x="18" y="80" width="64" height="6" fill="#8b5a2b"/></svg>),
"🏙":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm15" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm15)"/><rect x="20" y="44" width="16" height="40" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="38" y="32" width="18" height="52" fill="#5ac8fa" opacity="0.85" stroke="#a1a1a6" strokeWidth="1"/><rect x="58" y="24" width="14" height="60" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="74" y="50" width="10" height="34" fill="#5ac8fa" opacity="0.7"/><rect x="42" y="38" width="3" height="3" fill="#fff"/><rect x="49" y="38" width="3" height="3" fill="#fff"/><rect x="42" y="48" width="3" height="3" fill="#fff"/><rect x="49" y="48" width="3" height="3" fill="#fff"/><rect x="62" y="32" width="3" height="3" fill="#0a2540"/><rect x="62" y="42" width="3" height="3" fill="#ffcc00"/><rect x="62" y="52" width="3" height="3" fill="#0a2540"/></svg>),
"💧":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm16" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm16)"/><path d="M50 18 C50 18 30 46 30 60 C30 72 39 82 50 82 C61 82 70 72 70 60 C70 46 50 18 50 18 Z" fill="#5ac8fa" stroke="#a1a1a6" strokeWidth="1"/><ellipse cx="44" cy="52" rx="5" ry="10" fill="#fff" opacity="0.5"/></svg>),
"❓":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm17" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm17)"/><circle cx="50" cy="50" r="30" fill="#d12822"/><path d="M40 40 Q40 32 50 32 Q60 32 60 40 Q60 46 52 50 Q50 52 50 56" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round"/><circle cx="50" cy="66" r="3" fill="#fff"/></svg>),
"🔀":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm18" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm18)"/><path d="M20 36 L36 36 Q44 36 48 44 L52 56 Q56 64 64 64 L80 64" fill="none" stroke="#f8f8fa" strokeWidth="4" strokeLinecap="round"/><path d="M20 64 L36 64 Q44 64 48 56 L52 44 Q56 36 64 36 L80 36" fill="none" stroke="#5ac8fa" strokeWidth="4" strokeLinecap="round"/><path d="M72 30 L80 36 L72 42" fill="none" stroke="#5ac8fa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="M72 58 L80 64 L72 70" fill="none" stroke="#f8f8fa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>),
"🔑":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm19" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm19)"/><circle cx="32" cy="50" r="14" fill="none" stroke="#ffcc00" strokeWidth="6"/><circle cx="32" cy="50" r="4" fill="#5ac8fa"/><path d="M46 50 L76 50" stroke="#ffcc00" strokeWidth="6" strokeLinecap="round"/><path d="M66 50 L66 58 M72 50 L72 60" stroke="#ffcc00" strokeWidth="6" strokeLinecap="round"/></svg>),
"📭":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm20" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm20)"/><path d="M20 44 L50 28 L80 44 L80 76 L20 76 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M20 44 L50 60 L80 44" fill="none" stroke="#5ac8fa" strokeWidth="2"/><rect x="34" y="30" width="32" height="24" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="0.5"/></svg>),
"🔎":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm21" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm21)"/><circle cx="44" cy="44" r="18" fill="none" stroke="#f8f8fa" strokeWidth="5"/><circle cx="44" cy="44" r="14" fill="#5ac8fa" opacity="0.4"/><path d="M40 44 L48 44 M44 40 L44 48" stroke="#0a2540" strokeWidth="2.5"/><path d="M58 58 L78 78" stroke="#f8f8fa" strokeWidth="7" strokeLinecap="round"/></svg>),
"🌧":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm22" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm22)"/><path d="M32 40 Q20 40 20 52 Q20 64 32 64 L68 64 Q80 64 80 52 Q80 40 66 40 Q62 28 50 28 Q38 28 36 40 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><line x1="32" y1="70" x2="28" y2="82" stroke="#5ac8fa" strokeWidth="3" strokeLinecap="round"/><line x1="44" y1="70" x2="40" y2="82" stroke="#5ac8fa" strokeWidth="3" strokeLinecap="round"/><line x1="56" y1="70" x2="52" y2="82" stroke="#5ac8fa" strokeWidth="3" strokeLinecap="round"/><line x1="68" y1="70" x2="64" y2="82" stroke="#5ac8fa" strokeWidth="3" strokeLinecap="round"/></svg>),
"🏍":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm23" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm23)"/><circle cx="28" cy="66" r="10" fill="none" stroke="#f8f8fa" strokeWidth="3"/><circle cx="72" cy="66" r="10" fill="none" stroke="#f8f8fa" strokeWidth="3"/><path d="M28 66 L40 50 L60 50 L72 66" fill="none" stroke="#5ac8fa" strokeWidth="3"/><path d="M38 46 L44 38 L54 38" fill="none" stroke="#5ac8fa" strokeWidth="3" strokeLinecap="round"/></svg>),
"🚲":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm24" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm24)"/><circle cx="28" cy="66" r="12" fill="none" stroke="#f8f8fa" strokeWidth="3"/><circle cx="72" cy="66" r="12" fill="none" stroke="#f8f8fa" strokeWidth="3"/><path d="M28 66 L50 66 L60 42 L44 42 M60 42 L72 66 M50 66 L50 42 L66 42" fill="none" stroke="#5ac8fa" strokeWidth="2.5"/></svg>),
"⭕":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo1" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo1)"/><circle cx="50" cy="50" r="28" fill="none" stroke="#f8f8fa" strokeWidth="6"/><path d="M22 50 L78 50 M50 22 L50 78" stroke="#5ac8fa" strokeWidth="2" strokeDasharray="3,3"/></svg>),
"🅿️":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo2" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo2)"/><rect x="26" y="20" width="48" height="60" rx="6" fill="#1976d2" stroke="#f8f8fa" strokeWidth="2"/><text x="50" y="68" textAnchor="middle" fontSize="46" fontWeight="900" fill="#f8f8fa" fontFamily="Arial">P</text></svg>),
"🌾":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo3" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo3)"/><path d="M30 80 L30 40 M30 40 Q26 36 24 32 M30 40 Q34 36 36 32 M30 50 Q26 46 24 42 M30 50 Q34 46 36 42 M30 60 Q26 56 24 52 M30 60 Q34 56 36 52" stroke="#e8c547" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M50 80 L50 30 M50 30 Q46 26 44 22 M50 30 Q54 26 56 22 M50 40 Q46 36 44 32 M50 40 Q54 36 56 32 M50 50 Q46 46 44 42 M50 50 Q54 46 56 42 M50 60 Q46 56 44 52 M50 60 Q54 56 56 52" stroke="#e8c547" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M70 80 L70 40 M70 40 Q66 36 64 32 M70 40 Q74 36 76 32 M70 50 Q66 46 64 42 M70 50 Q74 46 76 42 M70 60 Q66 56 64 52 M70 60 Q74 56 76 52" stroke="#e8c547" strokeWidth="2.5" fill="none" strokeLinecap="round"/></svg>),
"↪":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo4" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo4)"/><path d="M22 70 Q22 30 60 30" fill="none" stroke="#f8f8fa" strokeWidth="6" strokeLinecap="round"/><path d="M50 18 L66 30 L50 42 Z" fill="#5ac8fa"/></svg>),
"🌉":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo5" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo5)"/><rect x="6" y="58" width="88" height="6" fill="#a87838"/><path d="M16 58 L16 80 M30 58 L30 80 M70 58 L70 80 M84 58 L84 80" stroke="#a87838" strokeWidth="3"/><path d="M16 58 Q50 28 84 58" fill="none" stroke="#f8f8fa" strokeWidth="3"/><path d="M30 58 L30 36 M50 58 L50 32 M70 58 L70 36" stroke="#f8f8fa" strokeWidth="2"/><rect x="6" y="64" width="88" height="14" fill="#5ac8fa" opacity="0.6"/></svg>),
"🌃":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo6" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo6)"/><circle cx="74" cy="26" r="6" fill="#f8f8fa"/><circle cx="76" cy="22" r="2" fill="#0a2540"/><rect x="14" y="50" width="20" height="34" fill="#444" stroke="#888" strokeWidth="0.5"/><rect x="40" y="38" width="22" height="46" fill="#555" stroke="#888" strokeWidth="0.5"/><rect x="68" y="46" width="18" height="38" fill="#444" stroke="#888" strokeWidth="0.5"/><rect x="17" y="54" width="3" height="3" fill="#ffd700"/><rect x="23" y="54" width="3" height="3" fill="#ffd700"/><rect x="17" y="62" width="3" height="3" fill="#ffd700"/><rect x="23" y="68" width="3" height="3" fill="#ffd700"/><rect x="43" y="42" width="3" height="3" fill="#ffd700"/><rect x="50" y="42" width="3" height="3" fill="#ffd700"/><rect x="56" y="50" width="3" height="3" fill="#ffd700"/><rect x="50" y="58" width="3" height="3" fill="#ffd700"/><rect x="71" y="50" width="3" height="3" fill="#ffd700"/><rect x="78" y="50" width="3" height="3" fill="#ffd700"/><rect x="71" y="60" width="3" height="3" fill="#ffd700"/></svg>),
"🏡":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo7" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo7)"/><path d="M22 78 L22 50 L50 28 L78 50 L78 78 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M18 52 L50 25 L82 52" fill="none" stroke="#dc3545" strokeWidth="3"/><rect x="42" y="58" width="16" height="20" fill="#a87838"/><rect x="28" y="56" width="10" height="10" fill="#5ac8fa"/><rect x="62" y="56" width="10" height="10" fill="#5ac8fa"/><circle cx="14" cy="80" r="6" fill="#3a7d2e"/><circle cx="86" cy="80" r="6" fill="#3a7d2e"/></svg>),
"🟫":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo8" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo8)"/><rect x="22" y="22" width="56" height="56" fill="#a87838" stroke="#f8f8fa" strokeWidth="2" strokeDasharray="4,3"/><path d="M30 70 Q34 60 40 64 M55 68 Q60 58 65 62" fill="none" stroke="#3a7d2e" strokeWidth="1.5"/><circle cx="44" cy="42" r="2" fill="#5a4020"/><circle cx="60" cy="50" r="2" fill="#5a4020"/></svg>),
"🏨":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo9" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo9)"/><rect x="20" y="18" width="60" height="66" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="44" y="60" width="12" height="24" fill="#a87838"/><rect x="26" y="26" width="6" height="6" fill="#5ac8fa"/><rect x="36" y="26" width="6" height="6" fill="#5ac8fa"/><rect x="46" y="26" width="6" height="6" fill="#5ac8fa"/><rect x="56" y="26" width="6" height="6" fill="#5ac8fa"/><rect x="66" y="26" width="6" height="6" fill="#5ac8fa"/><rect x="26" y="38" width="6" height="6" fill="#5ac8fa"/><rect x="36" y="38" width="6" height="6" fill="#5ac8fa"/><rect x="46" y="38" width="6" height="6" fill="#5ac8fa"/><rect x="56" y="38" width="6" height="6" fill="#5ac8fa"/><rect x="66" y="38" width="6" height="6" fill="#5ac8fa"/><rect x="26" y="50" width="6" height="6" fill="#5ac8fa"/><rect x="36" y="50" width="6" height="6" fill="#5ac8fa"/><rect x="56" y="50" width="6" height="6" fill="#5ac8fa"/><rect x="66" y="50" width="6" height="6" fill="#5ac8fa"/><text x="50" y="16" textAnchor="middle" fontSize="10" fontWeight="900" fill="#5ac8fa">H</text></svg>),
"🏚️":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo10" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo10)"/><path d="M22 78 L22 50 L50 28 L78 50 L78 78 Z" fill="#9a8870" stroke="#5a4a3a" strokeWidth="1"/><path d="M18 52 L50 25 L82 52" fill="none" stroke="#7a6a52" strokeWidth="3"/><path d="M30 30 L34 50 M50 25 L52 38" stroke="#5a4a3a" strokeWidth="1.2"/><rect x="42" y="58" width="14" height="20" fill="#5a3a20"/><rect x="44" y="60" width="3" height="6" fill="#1a1a1a"/><rect x="28" y="56" width="10" height="8" fill="#1a1a1a"/><path d="M28 60 L38 60 M30 56 L36 64" stroke="#5a4a3a" strokeWidth="0.8"/><rect x="62" y="56" width="10" height="8" fill="#1a1a1a"/><path d="M64 56 L70 64 M64 64 L70 56" stroke="#5a4a3a" strokeWidth="0.8"/></svg>),
"⛪":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo11" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo11)"/><rect x="26" y="48" width="48" height="36" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M22 50 L50 30 L78 50" fill="none" stroke="#dc3545" strokeWidth="3"/><rect x="46" y="14" width="8" height="20" fill="#a87838"/><rect x="42" y="20" width="16" height="6" fill="#a87838"/><rect x="44" y="56" width="12" height="20" fill="#a87838" rx="6"/><rect x="32" y="58" width="6" height="10" fill="#5ac8fa"/><rect x="62" y="58" width="6" height="10" fill="#5ac8fa"/></svg>),
"🏫":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo12" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo12)"/><rect x="14" y="36" width="72" height="48" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M14 38 L50 18 L86 38" fill="#dc3545" stroke="#a02020" strokeWidth="1"/><rect x="44" y="56" width="12" height="28" fill="#a87838"/><rect x="20" y="44" width="10" height="10" fill="#5ac8fa"/><rect x="34" y="44" width="10" height="10" fill="#5ac8fa"/><rect x="56" y="44" width="10" height="10" fill="#5ac8fa"/><rect x="70" y="44" width="10" height="10" fill="#5ac8fa"/><rect x="20" y="60" width="10" height="10" fill="#5ac8fa"/><rect x="34" y="60" width="10" height="10" fill="#5ac8fa"/><rect x="56" y="60" width="10" height="10" fill="#5ac8fa"/><rect x="70" y="60" width="10" height="10" fill="#5ac8fa"/><circle cx="50" cy="22" r="2.5" fill="#0a2540"/></svg>),
"🏭":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo13" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo13)"/><path d="M14 84 L14 56 L34 64 L34 48 L54 56 L54 40 L86 50 L86 84 Z" fill="#777" stroke="#f8f8fa" strokeWidth="1"/><rect x="22" y="68" width="6" height="10" fill="#1a1a1a"/><rect x="40" y="68" width="6" height="10" fill="#1a1a1a"/><rect x="60" y="68" width="6" height="10" fill="#1a1a1a"/><rect x="74" y="68" width="6" height="10" fill="#1a1a1a"/><rect x="68" y="22" width="10" height="22" fill="#777" stroke="#f8f8fa" strokeWidth="1"/><path d="M66 24 Q60 18 64 12 M76 24 Q82 18 78 12" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"/></svg>),
"🏬":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo14" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo14)"/><rect x="26" y="14" width="48" height="70" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="42" y="68" width="16" height="16" fill="#a87838"/><rect x="30" y="20" width="6" height="6" fill="#5ac8fa"/><rect x="40" y="20" width="6" height="6" fill="#5ac8fa"/><rect x="50" y="20" width="6" height="6" fill="#5ac8fa"/><rect x="60" y="20" width="6" height="6" fill="#5ac8fa"/><rect x="30" y="32" width="6" height="6" fill="#5ac8fa"/><rect x="40" y="32" width="6" height="6" fill="#5ac8fa"/><rect x="50" y="32" width="6" height="6" fill="#5ac8fa"/><rect x="60" y="32" width="6" height="6" fill="#5ac8fa"/><rect x="30" y="44" width="6" height="6" fill="#5ac8fa"/><rect x="40" y="44" width="6" height="6" fill="#5ac8fa"/><rect x="50" y="44" width="6" height="6" fill="#5ac8fa"/><rect x="60" y="44" width="6" height="6" fill="#5ac8fa"/><rect x="30" y="56" width="6" height="6" fill="#5ac8fa"/><rect x="40" y="56" width="6" height="6" fill="#5ac8fa"/><rect x="50" y="56" width="6" height="6" fill="#5ac8fa"/><rect x="60" y="56" width="6" height="6" fill="#5ac8fa"/></svg>),
"⬜":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo15" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo15)"/><rect x="20" y="20" width="60" height="60" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M30 20 L30 80 M40 20 L40 80 M50 20 L50 80 M60 20 L60 80 M70 20 L70 80 M20 30 L80 30 M20 40 L80 40 M20 50 L80 50 M20 60 L80 60 M20 70 L80 70" stroke="#a1a1a6" strokeWidth="0.6"/></svg>),
"🏪":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apo16" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apo16)"/><rect x="18" y="36" width="64" height="48" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="14" y="30" width="72" height="10" fill="#dc3545"/><path d="M14 30 L18 30 M22 30 L26 30 M30 30 L34 30 M38 30 L42 30 M46 30 L50 30 M54 30 L58 30 M62 30 L66 30 M70 30 L74 30 M78 30 L82 30" stroke="#a02020" strokeWidth="2"/><rect x="22" y="44" width="20" height="22" fill="#5ac8fa"/><rect x="44" y="64" width="12" height="20" fill="#a87838"/><rect x="58" y="44" width="20" height="22" fill="#5ac8fa"/><path d="M22 55 L42 55 M58 55 L78 55" stroke="#a1a1a6" strokeWidth="0.5"/></svg>),
"🚰":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm25" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm25)"/><rect x="28" y="42" width="44" height="36" rx="3" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M50 26 L50 42 M36 26 L50 26" stroke="#8e8e93" strokeWidth="3" strokeLinecap="round"/><circle cx="36" cy="26" r="3" fill="#5ac8fa"/><path d="M50 50 L50 66" stroke="#5ac8fa" strokeWidth="2.5" strokeLinecap="round"/><path d="M44 68 L50 76 L56 68" fill="#5ac8fa"/></svg>),
"➡":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm26" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm26)"/><path d="M20 50 L70 50" stroke="#f8f8fa" strokeWidth="8" strokeLinecap="round"/><path d="M58 36 L76 50 L58 64" fill="none" stroke="#5ac8fa" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
"↔":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apmarr" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apmarr)"/><path d="M22 50 L78 50" stroke="#f8f8fa" strokeWidth="7" strokeLinecap="round"/><path d="M34 38 L22 50 L34 62" fill="none" stroke="#5ac8fa" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path d="M66 38 L78 50 L66 62" fill="none" stroke="#5ac8fa" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
"🌲":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm27" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm27)"/><path d="M50 18 L34 38 L42 38 L30 52 L40 52 L26 68 L74 68 L60 52 L70 52 L58 38 L66 38 Z" fill="#1f7a30" stroke="#a1a1a6" strokeWidth="1"/><rect x="46" y="68" width="8" height="14" fill="#8b5a2b"/></svg>),
"👣":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm28" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm28)"/><ellipse cx="34" cy="40" rx="8" ry="12" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="30" cy="28" r="2" fill="#5ac8fa"/><circle cx="34" cy="26" r="2" fill="#5ac8fa"/><circle cx="38" cy="28" r="2" fill="#5ac8fa"/><ellipse cx="62" cy="62" rx="8" ry="12" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="58" cy="50" r="2" fill="#5ac8fa"/><circle cx="62" cy="48" r="2" fill="#5ac8fa"/><circle cx="66" cy="50" r="2" fill="#5ac8fa"/></svg>),
"👟":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm29" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm29)"/><path d="M22 58 Q22 50 30 48 L58 42 Q66 42 72 48 L78 60 Q80 66 74 70 L26 70 Q20 68 22 58 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M30 52 L58 46 L70 52" fill="none" stroke="#5ac8fa" strokeWidth="2"/><path d="M34 58 L40 62 M46 58 L52 62 M58 58 L64 62" stroke="#0a2540" strokeWidth="1.5"/></svg>),
"🪨":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm30" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm30)"/><path d="M30 44 Q26 38 34 32 L48 28 Q58 26 66 34 L74 46 Q78 58 70 66 L58 72 Q46 74 38 68 L28 60 Q24 52 30 44 Z" fill="#8e8e93" stroke="#a1a1a6" strokeWidth="1"/><path d="M40 40 L48 44 L58 40 M42 56 L52 60 L62 56" stroke="#f8f8fa" strokeWidth="1.5" opacity="0.5"/></svg>),
"⚡":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm31" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm31)"/><path d="M54 20 L32 50 L48 50 L42 80 L66 46 L50 46 Z" fill="#ffcc00" stroke="#a1a1a6" strokeWidth="1"/></svg>),
"🐛":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm32" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm32)"/><ellipse cx="50" cy="56" rx="20" ry="24" fill="#1f7a30" stroke="#a1a1a6" strokeWidth="1"/><circle cx="40" cy="42" r="3" fill="#ffcc00"/><circle cx="60" cy="42" r="3" fill="#ffcc00"/><path d="M36 30 L32 22 M64 30 L68 22" stroke="#f8f8fa" strokeWidth="2" strokeLinecap="round"/><path d="M30 50 L22 46 M30 60 L22 60 M30 70 L22 74 M70 50 L78 46 M70 60 L78 60 M70 70 L78 74" stroke="#f8f8fa" strokeWidth="2" strokeLinecap="round"/></svg>),
"📡":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm33" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm33)"/><path d="M50 48 L30 80 L70 80 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="50" cy="36" r="8" fill="#5ac8fa"/><path d="M36 28 Q50 18 64 28" fill="none" stroke="#5ac8fa" strokeWidth="2" strokeDasharray="2 2"/><path d="M28 24 Q50 8 72 24" fill="none" stroke="#5ac8fa" strokeWidth="2" strokeDasharray="2 2" opacity="0.6"/></svg>),
"🛠":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm34" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm34)"/><path d="M22 76 L44 54 L54 64 L32 86 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><circle cx="46" cy="54" r="8" fill="#5ac8fa"/><path d="M58 22 L68 22 L74 28 L68 34 L60 34 L56 42 L50 36 Z" fill="#8e8e93" stroke="#a1a1a6" strokeWidth="1"/></svg>),
"🧠":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm35" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm35)"/><path d="M34 30 Q22 30 22 44 Q22 52 28 56 Q22 62 28 70 Q30 78 42 80 Q50 82 58 80 Q70 78 72 70 Q78 62 72 56 Q78 52 78 44 Q78 30 66 30 Q58 22 50 24 Q42 22 34 30 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M50 24 L50 80" stroke="#5ac8fa" strokeWidth="1.5" opacity="0.5"/><path d="M34 40 Q42 44 50 40 Q58 44 66 40 M34 56 Q42 60 50 56 Q58 60 66 56 M36 72 Q44 76 50 72 Q56 76 64 72" stroke="#5ac8fa" strokeWidth="1.5" fill="none" opacity="0.7"/></svg>),
"🛡":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm36" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm36)"/><path d="M50 20 L76 30 L76 54 Q76 72 50 82 Q24 72 24 54 L24 30 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M50 34 L50 68 M38 50 L62 50" stroke="#5ac8fa" strokeWidth="4" strokeLinecap="round"/></svg>),
"🔧":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm37" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm37)"/><path d="M66 20 Q58 20 58 28 Q58 36 64 38 L68 58 L50 76 Q46 80 50 84 Q54 88 58 84 L76 66 L78 62 L78 42 L84 36 Q84 28 76 28 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1" transform="rotate(-45 50 50)"/><circle cx="36" cy="64" r="4" fill="#5ac8fa"/></svg>),
"🍳":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm38" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm38)"/><ellipse cx="46" cy="60" rx="26" ry="12" fill="#2a2a2a" stroke="#a1a1a6" strokeWidth="1"/><ellipse cx="46" cy="56" rx="26" ry="10" fill="#f8f8fa"/><circle cx="46" cy="56" r="8" fill="#ffcc00"/><circle cx="46" cy="56" r="4" fill="#ff6b35"/><rect x="72" y="54" width="16" height="4" fill="#8b5a2b"/></svg>),
"🚿":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm39" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm39)"/><rect x="40" y="20" width="20" height="10" rx="2" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="30" y="30" width="40" height="8" rx="4" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><line x1="34" y1="44" x2="32" y2="58" stroke="#5ac8fa" strokeWidth="3" strokeLinecap="round"/><line x1="44" y1="44" x2="42" y2="60" stroke="#5ac8fa" strokeWidth="3" strokeLinecap="round"/><line x1="54" y1="44" x2="52" y2="60" stroke="#5ac8fa" strokeWidth="3" strokeLinecap="round"/><line x1="64" y1="44" x2="62" y2="58" stroke="#5ac8fa" strokeWidth="3" strokeLinecap="round"/></svg>),
"🧺":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm40" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm40)"/><path d="M22 46 L78 46 L72 78 L28 78 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M30 46 Q30 28 50 28 Q70 28 70 46" fill="none" stroke="#5ac8fa" strokeWidth="3"/><path d="M22 54 L78 54 M34 46 L30 78 M50 46 L50 78 M66 46 L70 78" stroke="#5ac8fa" strokeWidth="1.5" opacity="0.6"/></svg>),
"🏗":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm41" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm41)"/><rect x="26" y="60" width="48" height="22" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><rect x="34" y="66" width="8" height="8" fill="#5ac8fa"/><rect x="46" y="66" width="8" height="8" fill="#5ac8fa"/><rect x="58" y="66" width="8" height="8" fill="#5ac8fa"/><path d="M50 20 L50 60 M50 20 L80 30" stroke="#ffcc00" strokeWidth="3"/><rect x="76" y="28" width="6" height="6" fill="#0a2540"/></svg>),
"🧎":(<svg viewBox="0 0 100 100" width="100%" height="100%" style={{display:"block"}}><defs><radialGradient id="apm42" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#apm42)"/><circle cx="50" cy="26" r="10" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><path d="M42 36 L42 58 L54 58 L58 72 L70 72 L70 80 L54 80 L42 70 L34 70 L34 80 L22 80 L22 66 L30 58 L30 38 Q30 34 34 34 L50 34 Q54 34 58 38 L58 48" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/></svg>)
};
const AppIcon=({name,size=20,mr=5,shadow=true})=>{const norm=(name||"").replace(/\uFE0F/g,'');const icon=APP_ICONS[norm]||APP_ICONS[name];if(!icon)return <span style={{fontSize:size}}>{name}</span>;return <span className="app-icon-svg" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:size,height:size,marginRight:mr,flexShrink:0,verticalAlign:"middle",filter:shadow?"drop-shadow(0 1px 2px rgba(0,0,0,0.25)) drop-shadow(0 0.5px 1px rgba(0,0,0,0.15))":"none"}}>{icon}</span>;};
// IconText: recebe string como "✅ Salvo" e renderiza emoji inicial como SVG + resto como texto.
// Útil para toasts, status messages e qualquer lugar onde emoji esteja embutido em string.
const IconText=({text,size=16,gap=5,style})=>{if(!text)return null;const s=String(text);try{const seg=new Intl.Segmenter("pt-BR",{granularity:"grapheme"});const parts=[...seg.segment(s)];let iconEnd=0;while(iconEnd<parts.length){const ch=parts[iconEnd].segment;if(/^\s$/.test(ch))break;const cp=ch.codePointAt(0);const isEmoji=(cp>=0x1F300&&cp<=0x1FAFF)||(cp>=0x2600&&cp<=0x27BF)||(cp>=0x1F900&&cp<=0x1F9FF)||(cp>=0x2190&&cp<=0x21FF);if(!isEmoji)break;iconEnd++;}if(iconEnd===0)return <span style={style}>{s}</span>;const iconSegs=parts.slice(0,iconEnd).map(p=>p.segment);const rest=parts.slice(iconEnd).map(p=>p.segment).join("").replace(/^\s+/,"");return <span style={{display:"inline-flex",alignItems:"center",gap:gap,...style}}>{iconSegs.map((e,i)=><AppIcon key={i} name={e} size={size} mr={0}/>)}{rest&&<span>{rest}</span>}</span>;}catch(e){return <span style={style}>{s}</span>;}};
// ════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function App(){
  // ──────────────────────────────────────────
  // ESTADO — Tema e Login
  // ──────────────────────────────────────────
// v240: estado inicial do tema agora respeita prefers-color-scheme do sistema operacional.
// Se o iPhone/Android estiver em modo escuro, o app abre escuro. Se há preferência
// salva por matrícula (cq_pref_dark_<mat>), ela sobrescreve depois — comportamento
// existente preservado.
const[dark,setDark]=useState(()=>{try{return typeof window!=="undefined"&&typeof window.matchMedia==="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches;}catch(_){return false;}});const[accent,setAccent]=useState("blue");const[tab,setTab]=useState(0);const[tabDir,setTabDir]=useState("r");const[data,setData]=useState({});const[resetKey,setResetKey]=useState(0);
// v240: escuta mudanças de modo claro/escuro do sistema operacional em tempo real.
// Só aplica enquanto o usuário não está logado (após login, a preferência salva
// por matrícula assume e este listener para de surtir efeito).
useEffect(()=>{try{if(typeof window==="undefined"||typeof window.matchMedia!=="function")return;const mq=window.matchMedia("(prefers-color-scheme: dark)");const onChange=(e)=>{if(!loginMat)setDark(!!e.matches);};if(mq.addEventListener)mq.addEventListener("change",onChange);else if(mq.addListener)mq.addListener(onChange);return()=>{if(mq.removeEventListener)mq.removeEventListener("change",onChange);else if(mq.removeListener)mq.removeListener(onChange);};}catch(_){/* silencioso */}},[]);// loginMat lido via closure; sem dep para não recriar listener
// useIsLargeScreen: retorna true em iPad/tablet/desktop (≥768px), false em celular.
// Atualiza em orientationchange/resize para responder à rotação do iPad.
const[isLarge,setIsLarge]=useState(()=>typeof window!=="undefined"&&window.innerWidth>=768);
useEffect(()=>{const onResize=()=>setIsLarge(window.innerWidth>=768);window.addEventListener("resize",onResize);window.addEventListener("orientationchange",onResize);return()=>{window.removeEventListener("resize",onResize);window.removeEventListener("orientationchange",onResize);};},[]);
const[loggedIn,setLoggedIn]=useState(false);const[loginName,setLoginName]=useState("");const[loginMat,setLoginMat]=useState("");const[slotIdx,setSlotIdx]=useState(0);const[fotoHQ,setFotoHQ]=useState(false);
// v247: tick do cronômetro de chegada — re-renderiza a cada 30s (suficiente
// pra mostrar contagem em minutos sem custo de bateria). Só roda enquanto
// está logado e ainda não tem dt_ter (encerramento da perícia).
const[clockTick,setClockTick]=useState(0);
useEffect(()=>{if(!loggedIn)return;const id=setInterval(()=>setClockTick(t=>t+1),30000);return()=>clearInterval(id);},[loggedIn]);
// Limpeza one-shot de chaves antigas do localStorage que não são mais usadas
useEffect(()=>{try{localStorage.removeItem("cq_recentDPs");localStorage.removeItem("cq_fotoHQ");}catch(e){console.warn("CQ legacy cleanup:",e);}},[]);
// ──────────────────────────────────────────
// QUOTA REAL DO DISPOSITIVO (v221+)
// Lê navigator.storage.estimate() na inicialização e a cada 30s.
// Substitui o limite hardcoded de 40 MB pela quota real (gigabytes em iOS).
// Cai pro placeholder QUOTA_PLACEHOLDER_KB se a API não estiver disponível.
// ──────────────────────────────────────────
const[quotaKB,setQuotaKB]=useState(QUOTA_PLACEHOLDER_KB);
useEffect(()=>{let alive=true;const poll=async()=>{if(typeof document!=="undefined"&&document.visibilityState==="hidden")return;try{if(window.storage&&typeof window.storage.estimate==="function"){const est=await window.storage.estimate();if(alive&&est&&typeof est.quota==="number"&&est.quota>0){setQuotaKB(Math.round(est.quota/1024));}}}catch(e){/* silencioso */}};poll();const id=setInterval(poll,30000);const onVis=()=>{if(typeof document!=="undefined"&&document.visibilityState==="visible")poll();};document.addEventListener("visibilitychange",onVis);return()=>{alive=false;clearInterval(id);document.removeEventListener("visibilitychange",onVis);};},[]);
// Load full slot from 3 keys: main + fotos + desenho
// v223: parse errors em fotos/desenho agora notificam toast e marcam flag (antes eram silenciosos)
const loadFullSlot=useCallback(async(pfx)=>{let bd;try{const r=await window.storage?.get(pfx);if(!r||!r.value)return null;try{bd=JSON.parse(r.value);}catch(parseErr){console.error("CQ slot corrompido (JSON inválido):",pfx,parseErr);try{showToast("⚠ Slot "+pfx.split("_").pop()+" corrompido — dados ilegíveis");}catch(e){}return null;}}catch(e){return null;}try{const rf=await window.storage.get(pfx+"_f");if(rf&&rf.value){try{bd.fotos=JSON.parse(rf.value);}catch(parseErr){console.error("CQ fotos corrompidas:",pfx,parseErr);try{showToast("⚠ Slot "+pfx.split("_").pop()+" — fotos corrompidas (dados textuais OK)");}catch(e){}bd.fotos=[];bd._fotosCorrupted=true;}}}catch(e){console.warn("CQ loadSlot fotos:",e);}try{const rd=await window.storage.get(pfx+"_d");if(rd&&rd.value){try{bd.desenho=JSON.parse(rd.value);}catch(parseErr){console.error("CQ desenho corrompido:",pfx,parseErr);try{showToast("⚠ Slot "+pfx.split("_").pop()+" — desenho corrompido");}catch(e){}bd._desenhoCorrupted=true;}}}catch(e){console.warn("CQ:",e);}return bd;},[]);
const deleteFullSlot=useCallback(async(pfx)=>{try{await window.storage?.delete(pfx);}catch(e){console.warn("CQ:",e);}try{await window.storage?.delete(pfx+"_f");}catch(e){console.warn("CQ:",e);}try{await window.storage?.delete(pfx+"_d");}catch(e){console.warn("CQ:",e);}},[]);
  // ──────────────────────────────────────────
  // ESTADO — Dados do croqui
  // Vestígios, vestes, papiloscopia, feridas,
  // edificações, cadáveres, veículos, fotos
  // ──────────────────────────────────────────
const[vestigios,setVestigios]=useState([{id:1,desc:"",suporte:"",coord1:"",coord2:"",altura:"",recolhido:"",destino:"",obs:"",placa:""}]);
const[vestes,setVestes]=useState([{id:1,tipo:"",cor:"",sujidades:"",sangue:"",bolsos:"",notas:""}]);
const[papilos,setPapilos]=useState([{id:1,desc:"",local:"",placa:""}]);
const[wounds,setWounds]=useState([]);const[edificacoes,setEdificacoes]=useState([mkEdif()]);
const[bodyView,setBodyView]=useState("front");const[cadaverIdx,setCadaverIdx]=useState(0);
const[cadaveres,setCadaveres]=useState([{id:1,label:"Cadáver 1"}]);
const[veiView,setVeiView]=useState("ext_lat_e");const[veiVest,setVeiVest]=useState([]);const[trilhas,setTrilhas]=useState([]);
const[veiculos,setVeiculos]=useState([{id:1,label:"Veículo 1"}]);const[veiIdx,setVeiIdx]=useState(0);
const canvasRef=useRef(null);const canvasScrollRef=useRef(null);const ctxRef=useRef(null);const imgRef=useRef({});const canvasLoadedRef=useRef({current:true});const canvasDirtyRef=useRef({current:false});const[desenhos,setDesenhos]=useState([{id:1,label:"Croqui 1"}]);const[desenhoIdx,setDesenhoIdx]=useState(0);
const drawRef=useRef(false);const startRef=useRef({x:0,y:0});const snapRef=useRef(null);const histRef=useRef([]);
const[tool,setTool]=useState("pen");const[color,setColor]=useState("#000000");const[sz,setSz]=useState(3);
const[pStyle,setPStyle]=useState("solid");const[lMode,setLMode]=useState("free");const[stmp,setStmp]=useState(null);const[stampRot,setStampRot]=useState(0);
// v245: stampSz e tolerância de hit-test agora são DINÂMICOS — calculados em
// função do tamanho real do canvas na tela (getBoundingClientRect). No celular
// (canvas exibido em ~380 px) o stamp nasce com ~140 px lógicos do canvas → ~44 pt
// na tela (mínimo iOS HIG / Material Design / WCAG 2.1). Resolve "stamps pequenos
// demais" e "área de seleção difícil de tocar" reportados pelo usuário.
const getStampSz=()=>{const c=canvasRef.current;if(!c)return 80;const r=c.getBoundingClientRect();if(!r||r.width<1)return 80;const targetCanvasPx=(1200/r.width)*44;return Math.max(80,Math.round(targetCanvasPx));};
const getHitTol=()=>{const c=canvasRef.current;if(!c)return 14;const r=c.getBoundingClientRect();if(!r||r.width<1)return 14;const scale=1200/r.width;return Math.max(14,Math.round(scale*22));};
const lineEndsRef=useRef([]);const[showTextInput,setShowTextInput]=useState(false);const templateRef=useRef(null);const templatesRef=useRef({});const[textPos,setTextPos]=useState({x:0,y:0});const[textVal,setTextVal]=useState("");const[showGrid,setShowGrid]=useState(false);
const[canvasVest,setCanvasVest]=useState([]);const[exportView,setExportView]=useState(null);const[exportData,setExportData]=useState("");
const redoRef=useRef([]);const[zoomLvl,setZoomLvl]=useState(1);const eraserCanvasRef=useRef(null);const pinchRef=useRef(null);
  // ──────────────────────────────────────────
  // ESTADO — Canvas e Stamps
  // ──────────────────────────────────────────
const overlayRef=useRef(null);const[stampObjs,setStampObjs]=useState([]);const[selStamp,setSelStamp]=useState(null);const dragRef=useRef(null);const[ppm,setPpm]=useState(40);const[shiftHeld,setShiftHeld]=useState(false);const[isOnline,setIsOnline]=useState(typeof navigator!=="undefined"?navigator.onLine!==false:true);
const[gpsLoading,setGpsLoading]=useState(false);const[edifCollapsed,setEdifCollapsed]=useState({});
const[fotos,setFotos]=useState([]);const[editFotoId,setEditFotoId]=useState(null);const[fotoFilter,setFotoFilter]=useState("");const[vestFilter,setVestFilter]=useState("all");const[vestCompact,setVestCompact]=useState(false);const[expandedVest,setExpandedVest]=useState({});
  // ──────────────────────────────────────────
  // UTILITÁRIOS — Compressão de imagem e FotoBtn
  // FotoBtn: botão 📷(câmera) + 🖼️(galeria)
  // ──────────────────────────────────────────
const compressImg=async(file,opts={})=>{const hq=opts.hq===true;const maxW=opts.maxW||(hq?2400:1200);const quality=opts.quality||(hq?0.92:0.78);// Pré-validação: rejeita arquivos > 20MB para evitar OOM no iOS Safari
if(file.size>20*1024*1024)throw new Error("Imagem muito grande ("+Math.round(file.size/1024/1024)+"MB) — limite 20MB. Reduza no app de fotos antes.");let img;let needsClose=false;if(typeof createImageBitmap==="function"){img=await createImageBitmap(file);needsClose=true;}else{img=await new Promise((res,rej)=>{const r=new FileReader();r.onload=ev=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error("Imagem inválida"));im.src=ev.target.result;};r.onerror=()=>rej(new Error("Erro leitura"));r.readAsDataURL(file);});}try{const ratio=Math.min(maxW/img.width,maxW/img.height,1);const w=Math.round(img.width*ratio);const h=Math.round(img.height*ratio);const cv=document.createElement("canvas");cv.width=w;cv.height=h;const cx=cv.getContext("2d");cx.drawImage(img,0,0,w,h);const dataUrl=cv.toDataURL("image/jpeg",quality);const sizeKB=Math.round(dataUrl.length*3/4/1024);// Free canvas memory immediately (helps iOS Safari avoid OOM)
cv.width=0;cv.height=0;return{dataUrl,w,h,sizeKB,name:file.name,ts:new Date().toISOString(),hq};}finally{if(needsClose&&img&&typeof img.close==="function"){try{img.close();}catch(e){console.warn("CQ bitmap close:",e);}}}};
const updateFoto=(fotoId,field,value)=>setFotos(prev=>prev.map(f=>f.id===fotoId?{...f,[field]:value}:f));
// Helper: cria um <input type=file> programático e dispara o picker.
// Usado em 5 lugares (foto da câmera, anexar do rolo, importar JSON, mapa→canvas, etc).
// onCancel é chamado quando o usuário fecha o picker sem escolher (Chrome 113+, Safari 16.4+).
const pickFile=({accept,capture,multiple,onPick,onCancel})=>{const inp=document.createElement("input");inp.type="file";if(accept)inp.accept=accept;if(capture)inp.capture=capture;if(multiple)inp.multiple=true;inp.style.display="none";document.body.appendChild(inp);let handled=false;const cleanup=()=>{try{document.body.removeChild(inp);}catch(e){/* ignore */}};inp.onchange=()=>{handled=true;const fls=Array.from(inp.files||[]);cleanup();if(fls.length)onPick(fls);};inp.addEventListener("cancel",()=>{if(!handled&&onCancel)onCancel();cleanup();});inp.click();};
// Captura GPS rapidamente para anexar às fotos (5s timeout, retorna null se falhar)
const captureGPS=()=>new Promise((res)=>{if(!navigator.geolocation)return res(null);const timer=setTimeout(()=>res(null),5000);navigator.geolocation.getCurrentPosition(p=>{clearTimeout(timer);res({lat:p.coords.latitude,lng:p.coords.longitude,acc:Math.round(p.coords.accuracy||0),ts:new Date().toISOString()});},()=>{clearTimeout(timer);res(null);},{enableHighAccuracy:true,timeout:4500,maximumAge:30000});});

const mkAutoLegend=(rk)=>{const d=data;const end=d.end||"";const endShort=end.length>50?end.slice(0,50)+"…":end;const nat=d.nat==="Outros"&&d.nat_outro?d.nat_outro:(d.nat||"");const ocStr=d.oc?`Oc. ${d.oc}/${(d.oc_ano||"").slice(-2)}`:"";const dpStr=d.dp||"";
// Tab-level camera
if(rk==="solicitacao"){return{desc:`Vista geral do local${nat?" — "+nat:""}${ocStr?", "+ocStr:""}`,local:endShort||dpStr||"Local não informado"};}
if(rk==="local"){const tp=d.tp||"";const area=d.area||"";return{desc:`Local do fato${tp?" — "+tp:""}${area?", "+area:""}`,local:endShort||"Endereço não informado"};}
if(rk==="vestigios"){const nVest=vestigios.filter(v=>v.desc).length;return{desc:`Vestígios no local (${nVest} registrado${nVest!==1?"s":""})`,local:endShort||"Local"};}
if(rk==="cadaver"){const ci=cadaverIdx;const cx="c"+ci+"_";const sx=d[cx+"sx"]||"";const pos=d[cx+"pos"]||"";const lab=cadaveres[ci]?.label||"Cadáver";return{desc:`${lab}${sx?" — "+sx:""}${pos?", "+pos:""}`,local:endShort||"Local do cadáver"};}
if(rk.startsWith("cad_desc_")){const ci=+rk.split("_")[2]||cadaverIdx;const lab=cadaveres[ci]?.label||"Cadáver";return{desc:`Descrição — ${lab}`,local:endShort||"Local do cadáver"};}
if(rk.startsWith("cad_diag_")){const ci=+rk.split("_")[2]||cadaverIdx;const lab=cadaveres[ci]?.label||"Cadáver";const dg=d["c"+ci+"_dg"]||"";return{desc:`Diagnóstico — ${lab}${dg?" — "+dg:""}`,local:endShort||"Local do cadáver"};}
if(rk.startsWith("cad_vestes_")){const ci=+rk.split("_")[2]||cadaverIdx;const lab=cadaveres[ci]?.label||"Cadáver";return{desc:`Vestes — ${lab}`,local:endShort||"Local do cadáver"};}
if(rk.startsWith("veste_")){const id=+rk.slice(6);const v=vestes.find(x=>x.id===id);const ci=(v&&v.cadaver!==undefined)?v.cadaver:cadaverIdx;const lab=cadaveres[ci]?.label||"Cadáver";return{desc:`Veste do ${lab}${v&&v.tipo?" — "+v.tipo:""}${v&&v.cor?" ("+v.cor+")":""}`,local:endShort||"Local do cadáver"};}
if(rk==="veiculo"){const vi=veiIdx;const vx="v"+vi+"_";const tipo=d[vx+"tipo"]||"";const cor=d[vx+"cor"]||"";const placa=d[vx+"placa"]||"";const lab=veiculos[vi]?.label||"Veículo";return{desc:`${lab}${tipo?" — "+tipo:""}${cor?" "+cor:""}${placa?", placa "+placa:""}`,local:endShort||"Local do veículo"};}
if(rk==="geral"){return{desc:`Registro fotográfico${nat?" — "+nat:""}`,local:endShort||dpStr||""};}
// Isolamento / Endereço / Via
if(rk==="isolamento"){const resp=d.rp||"";const iso=d.iso||"";return{desc:`Isolamento do local${iso?" — "+iso:""}${resp?", resp.: "+resp:""}`,local:endShort||"Perímetro de isolamento"};}
if(rk==="endereco"){return{desc:`Fachada/acesso — ${end||"endereço não informado"}`,local:endShort};}
if(rk==="via"){const pav=d.vp_pav||"";const fx=d.vp_faixas||"";return{desc:`Via pública${pav?" — "+pav:""}${fx?", "+fx+" faixa(s)":""}`,local:endShort||"Via pública"};}
// Edificação
if(rk.startsWith("edif_")){const id=+rk.slice(5);const idx=edificacoes.findIndex(e=>e.id===id);const e=edificacoes[idx];if(e){const tp=e.tipo||"";const mat=e.material||"";const and=e.andares||"";return{desc:`Edificação ${idx+1}${tp?" — "+tp:""}${mat?", "+mat:""}${and?", "+and+" andar(es)":""}`,local:e.nome||endShort||"Edificação"};}return{desc:`Edificação ${idx>-1?idx+1:""}`,local:endShort};}
if(rk.startsWith("comodo_")){const parts=rk.split("_");const comodo=parts.slice(2).join(" ");return{desc:`Cômodo: ${comodo}`,local:endShort||"Interior da edificação"};}
// Vestígios
if(rk.startsWith("vest_")){const id=+rk.slice(5);const v=vestigios.find(x=>x.id===id);if(v&&v.desc){const sup=v.suporte?" — suporte: "+v.suporte:"";const coords=v.coord1||v.coord2?` (D1:${v.coord1||"—"} D2:${v.coord2||"—"}${v.altura?" h:"+v.altura:""})`:"";const obs=v.obs?" — "+v.obs:"";return{desc:`Vestígio: ${v.desc}${sup}${coords}`,local:endShort||(v.suporte||"Local do vestígio")};}return{desc:"Vestígio",local:endShort};}
if(rk.startsWith("placa_")){const lbl=rk.slice(6);const cv=canvasVest.find(v=>v.placa===lbl);if(cv&&cv.desc){return{desc:`Vestígio [${lbl}]: ${cv.desc}${cv.suporte?" — "+cv.suporte:""}`,local:endShort||"Croqui"};}return{desc:`Vestígio croqui — placa ${lbl}`,local:endShort||"Croqui"};}
// Cadáver / Lesão
if(rk.startsWith("cad_")){const id=+rk.slice(4);const c=cadaveres.find(x=>x.id===id);const ci2=cadaveres.findIndex(x=>x.id===id);const cx2="c"+(ci2>-1?ci2:0)+"_";const sx=d[cx2+"sx"]||"";return{desc:`${c?.label||"Cadáver"}${sx?" — "+sx:""}`,local:endShort||"Local do cadáver"};}
if(rk.startsWith("wound_")){const id=+rk.slice(6);const w=wounds.find(x=>x.id===id);if(w){const ci2=w.cadaver??0;const lab=cadaveres[ci2]?.label||"Cadáver";const tp=w.tipo?" — "+w.tipo:"";return{desc:`Lesão em ${w.regionLabel}${tp}, ${lab}`,local:endShort||lab};}return{desc:"Lesão",local:endShort};}
// Veículo / Vest. veicular
if(rk.startsWith("vei_")){const id=+rk.slice(4);const vi2=veiculos.findIndex(x=>x.id===id);const vx="v"+(vi2>-1?vi2:0)+"_";const tipo=d[vx+"tipo"]||"";const cor=d[vx+"cor"]||"";const placa=d[vx+"placa"]||"";return{desc:`${veiculos[vi2]?.label||"Veículo"}${tipo?" — "+tipo:""}${cor?" "+cor:""}${placa?", "+placa:""}`,local:endShort||"Local do veículo"};}
if(rk.startsWith("veivest_")){const id=+rk.slice(8);const v=veiVest.find(x=>x.id===id);if(v){const vi2=v.veiculo??0;const vx="v"+vi2+"_";const veiLabel=veiculos[vi2]?.label||"Veículo";const tipo=d[vx+"tipo"]||"";return{desc:`Vest. veicular: ${v.regionLabel}${v.tipo?" — "+v.tipo:""}`,local:`${veiLabel}${tipo?" ("+tipo+")":""}`};}return{desc:"Vestígio veicular",local:endShort};}
// Papiloscopia
if(rk.startsWith("papilo_")){const id=+rk.slice(7);const p=papilos.find(x=>x.id===id);if(p&&p.desc){return{desc:`Papiloscopia: ${p.desc}`,local:p.local||endShort||"Local da coleta"};}return{desc:"Papiloscopia",local:endShort};}
return{desc:rk,local:endShort};
};
const FotoBtn=({rk})=>{const mf=(fotos||[]).filter(f=>f.ref===rk);const processFiles=async(fls)=>{if(!fls||!fls.length)return;const legend=mkAutoLegend(rk);const gps=await captureGPS();const novas=[];for(const fl of fls){try{const foto=await compressImg(fl,{hq:fotoHQ});novas.push({id:uid(),ref:rk,desc:legend.desc,fase:"",local:legend.local,...foto,...(gps?{gps}:{})});}catch(err){showToast("❌ "+err.message);}}if(novas.length){setFotos(p=>[...p,...novas]);haptic("heavy");showToast("📷 "+novas.length+(novas.length>1?" fotos":" foto")+(gps?" 📍":""));}};const openPicker=(useCapture)=>pickFile({accept:"image/*",capture:useCapture?"environment":undefined,multiple:!useCapture,onPick:processFiles,onCancel:useCapture?()=>setCameraCancelCount(c=>{const nc=c+1;if(nc>=2)setShowCameraHelp(true);return nc;}):undefined});return(<span style={{display:"inline-flex",alignItems:"center",gap:2,marginLeft:6,flexShrink:0}}>
<button type="button" onClick={()=>openPicker(true)} title={mf.length?`${mf.length} foto${mf.length>1?"s":""} — tirar mais`:"Tirar foto"} aria-label={mf.length?`Tirar mais foto. Já tem ${mf.length}.`:"Tirar foto"} style={{cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:4,padding:"4px 12px",minWidth:40,minHeight:44,borderRadius:10,background:mf.length?"rgba(0,122,255,0.12)":"transparent",border:`1.5px solid ${mf.length?t.ac:t.bd}`,color:mf.length?t.ac:t.t3,fontFamily:"inherit"}}><Camera size={16} strokeWidth={2.2}/>{mf.length>0&&<span style={{fontSize:13,fontWeight:700,lineHeight:1}}>{mf.length}</span>}</button>
<button type="button" onClick={()=>setBurstCtx({rk})} title="Várias fotos — sem fechar a câmera entre cada uma" aria-label="Várias fotos seguidas sem fechar a câmera" style={{cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"4px 12px",minWidth:40,minHeight:44,borderRadius:10,background:"transparent",border:`1.5px solid ${t.bd}`,color:t.t3,fontFamily:"inherit"}}><Layers size={16} strokeWidth={2.2}/></button>
<button type="button" onClick={()=>openPicker(false)} title="Escolher da galeria" aria-label="Escolher da galeria" style={{cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"4px 12px",minWidth:40,minHeight:44,borderRadius:10,background:"transparent",border:`1.5px solid ${t.bd}`,color:t.t3,fontFamily:"inherit"}}><ImageIcon size={16} strokeWidth={2.2}/></button>
{mf.map(f=><span key={f.id} style={{position:"relative",display:"inline-block"}}><img src={f.dataUrl} loading="lazy" decoding="async" style={{width:72,height:72,objectFit:"cover",borderRadius:8,border:f.desc?"2px solid #34c759":"1.5px solid #007aff",cursor:"pointer"}} onClick={()=>setEditFotoId(f.id)} title="Toque para editar descrição" aria-label="Toque para editar descrição"/><button type="button" aria-label="Remover foto" style={{position:"absolute",top:-10,right:-10,background:"#ff3b30",color:"#fff",border:"2px solid #fff",borderRadius:"50%",width:36,height:36,fontSize:20,cursor:"pointer",lineHeight:"30px",textAlign:"center",padding:0,fontWeight:700,boxShadow:"0 2px 4px rgba(0,0,0,0.3)"}} onClick={()=>setFotos(prev=>prev.filter(x=>x.id!==f.id))}>×</button>{!f.desc&&<span style={{position:"absolute",bottom:-3,left:"50%",transform:"translateX(-50%)",fontSize:8,color:"#ff9500",fontWeight:700}}>✏️</span>}</span>)}</span>);};

  // ──────────────────────────────────────────
  // EFEITOS — Teclado (Shift para snap angular)
  // ──────────────────────────────────────────
useEffect(()=>{const kd=e=>{if(e.key==="Shift")setShiftHeld(true);};const ku=e=>{if(e.key==="Shift")setShiftHeld(false);};window.addEventListener("keydown",kd);window.addEventListener("keyup",ku);return()=>{window.removeEventListener("keydown",kd);window.removeEventListener("keyup",ku);};},[]);
useEffect(()=>{const onUp=()=>setIsOnline(true);const onDown=()=>setIsOnline(false);window.addEventListener("online",onUp);window.addEventListener("offline",onDown);return()=>{window.removeEventListener("online",onUp);window.removeEventListener("offline",onDown);};},[]);
useEffect(()=>{
// Navigation protection — só alerta se realmente houver mudança não salva
// (evita o cry-wolf que faz o usuário ignorar o alerta quando ele importa de verdade)
// v242: se fotos travadas no save (photoSaveStuckRef), FORÇA alerta mesmo com isDirty=false
const h=e=>{const stuck=photoSaveStuckRef.current;if(!isDirtyRef.current&&!stuck)return;e.preventDefault();e.returnValue=stuck?"⚠ Fotos não foram salvas — feche apenas após o banner verde!":"Dados não salvos!";return e.returnValue;};
window.onbeforeunload=h;window.addEventListener("beforeunload",h);
// Back button protection
const pushGuard=()=>{try{window.history.pushState({croquiGuard:true},"");}catch(e){console.warn("CQ:",e);}}; pushGuard();
const onPop=(e)=>{setConfirmBack({onYes:()=>{window.onbeforeunload=null;window.removeEventListener("beforeunload",h);window.removeEventListener("popstate",onPop);window.history.back();}});pushGuard();};window.addEventListener("popstate",onPop);
// v205: meta tags, favicon, manifest movidos para index.html físico (mais rápido + WhatsApp consegue ler)
return()=>{window.onbeforeunload=null;window.removeEventListener("beforeunload",h);window.removeEventListener("popstate",onPop);};},[]);const gpsRef=useRef(null);
const[pdfHTML,setPdfHTML]=useState("");const[pdfTitle,setPdfTitle]=useState("");
const[copyOk,setCopyOk]=useState("");const[pdfBusy,setPdfBusy]=useState(false);const[pdfDataUrl,setPdfDataUrl]=useState(null);const[pdfViewOpen,setPdfViewOpen]=useState(false);

const s=useCallback((k,v)=>setData(p=>({...p,[k]:v})),[]);const dataRef=useRef(data);dataRef.current=data;const g=useCallback(k=>dataRef.current[k]??"",[]);

// ── AUTO-BACKUP SYSTEM ──
  // ──────────────────────────────────────────
  // UTILITÁRIOS — Toast de notificação
  // ──────────────────────────────────────────
const[backupStatus,setBackupStatus]=useState("");const[showConfirmNovo,setShowConfirmNovo]=useState(false);const[showConfirmRecup,setShowConfirmRecup]=useState(false);const[recupData,setRecupData]=useState(null);const[showTemplatePicker,setShowTemplatePicker]=useState(false);const[showLocalPicker,setShowLocalPicker]=useState(false);const[pendingTemplateId,setPendingTemplateId]=useState(null);const[showCameraHelp,setShowCameraHelp]=useState(false);const[cameraCancelCount,setCameraCancelCount]=useState(0);const[showConfirmDeleteAll,setShowConfirmDeleteAll]=useState(false);const[deleteAllInput,setDeleteAllInput]=useState("");const[burstCtx,setBurstCtx]=useState(null);const[showDiag,setShowDiag]=useState(false);const[zipProgress,setZipProgress]=useState(null);const[zipNowTick,setZipNowTick]=useState(0);const[advExpanded,setAdvExpanded]=useState(false);
// v236: tick por segundo enquanto o ZIP está sendo gerado — atualiza o
// cronômetro no modal sem depender de novos eventos de progresso.
useEffect(()=>{if(!zipProgress||zipProgress.error||zipProgress.stage==="Concluído"||zipProgress.stage==="Cancelado")return;const id=setInterval(()=>setZipNowTick(Date.now()),1000);return()=>clearInterval(id);},[zipProgress]);
// Templates personalizados do perito (salvos por matrícula)
const[customTemplates,setCustomTemplates]=useState([]);
const[showSaveTemplate,setShowSaveTemplate]=useState(false);
const[tplNameInput,setTplNameInput]=useState("");
const[tplDescInput,setTplDescInput]=useState("");
const[toast,setToast]=useState("");const showToast=(msg)=>{setToast(msg);// Auto-haptic baseado no tipo da mensagem
try{if(msg.startsWith("✅")||msg.includes("Salvo")||msg.includes("Copiado")||msg.includes("restaurado")||msg.includes("carregado"))haptic("success");else if(msg.startsWith("❌"))haptic("error");else if(msg.startsWith("⚠")||msg.includes("Atenção"))haptic("warning");else if(msg.startsWith("📷"))haptic("medium");}catch(e){/* haptic não suportado, ok */}setTimeout(()=>setToast(""),3000);};
// Expor showToast globalmente para componentes fora do App (F_ etc.)
useEffect(()=>{window.__cqToast=showToast;return()=>{if(window.__cqToast===showToast)window.__cqToast=null;};},[]);// eslint-disable-line react-hooks/exhaustive-deps
// ── PDF pre-loading: baixa html2pdf assim que logar ──
// Valores: null=não tentou, "loading"=baixando, "ok"=pronto p/ offline, "fail"=falhou
const[pdfReady,setPdfReady]=useState(null);
// ── Dirty flag: controla se há alterações não salvas ──
const isDirtyRef=useRef(false);
const[saveState,setSaveState]=useState("saved"); // "saved" | "dirty" | "saving" | "error"
// v242: photoSaveStuck — fica true se as FOTOS falharam ao salvar mesmo com retry.
// Diferente do saveState (que reseta a cada tentativa), este aqui persiste até as
// fotos finalmente baterem disco. Disparra banner sticky de aviso pesado.
const[photoSaveStuck,setPhotoSaveStuck]=useState(false);
const photoSaveStuckRef=useRef(false);// espelho pro beforeunload (closure-safe)
useEffect(()=>{photoSaveStuckRef.current=photoSaveStuck;},[photoSaveStuck]);
// confirmDel: modal genérico para confirmar exclusão com dados.
// {title, msg, onYes, onNo?, okLabel?, okIcon?, danger?, cancelLabel?}|null
// v242: agora aceita opts para reaproveitar como modal genérico (não só "deletar")
const[confirmDel,setConfirmDel]=useState(null);
const reqDel=(title,msg,onYes,opts)=>setConfirmDel({title,msg,onYes:()=>{onYes();setConfirmDel(null);haptic("medium");},onNo:opts?.onNo,okLabel:opts?.okLabel,okIcon:opts?.okIcon,danger:opts?.danger!==false,cancelLabel:opts?.cancelLabel});
// v242: confirmAsync — versão Promise<boolean> do reqDel, usada em fluxos async
// (ex: savePDF que precisa esperar o usuário decidir antes de gerar o arquivo).
const confirmAsync=(title,msg,opts)=>new Promise(res=>{setConfirmDel({title,msg,onYes:()=>{setConfirmDel(null);haptic("medium");res(true);},onNo:()=>{setConfirmDel(null);res(false);},okLabel:opts?.okLabel,okIcon:opts?.okIcon,danger:opts?.danger!==false,cancelLabel:opts?.cancelLabel});});
const[confirmBack,setConfirmBack]=useState(null);
// Haptic patterns inspirados em UIKit Feedback Generator (iOS)
const haptic=(type=50)=>{try{if(typeof type==="number"){navigator.vibrate?.(type);return;}// Patterns nomeados (estilo iOS)
const patterns={selection:10,light:15,medium:30,heavy:50,success:[15,40,15],warning:[30,80,30],error:[50,80,50,80,50],pulse:[20,60,20]};const p=patterns[type]||30;navigator.vibrate?.(p);}catch(e){/* vibrate não suportado, ok */}};
const backupTimerRef=useRef(null);const savingRef=useRef(false);const pendingSaveRef=useRef(false);const exportingZipRef=useRef(false);const zipCancelRef=useRef(false);const zipProgressTimerRef=useRef(null);const zipStartedAtRef=useRef(0);
// ── STATE REF — stable reference for saveBackup (avoids 17+ dependencies) ──
const stateSnap=useRef({});
// Update stateSnap ref directly (no useEffect needed)
stateSnap.current={data,vestigios,vestes,papilos,wounds,edificacoes,veiVest,canvasVest,cadaveres,veiculos,desenhos,ppm,stampObjs,trilhas,fotos};
// R2: trava o slot que está sendo salvo, para detectar troca durante o save
// Reseta veiView para view válida quando muda de veículo ou muda a categoria do veículo atual
useEffect(()=>{const cat=data["v"+veiIdx+"_cat"]||"Carro";const viewsByCat={Carro:["ext_lat_e","ext_lat_d","ext_frente","ext_tras","ext_teto","interior"],Moto:["moto_lat_e","moto_lat_d","moto_frente","moto_tras"],Bicicleta:["bici_lat_e","bici_lat_d"],"Caminhão":["cam_lat_e","cam_lat_d","cam_frente","cam_tras","cam_int"],"Ônibus":["bus_lat_e","bus_lat_d","bus_frente","bus_tras","bus_int"]};const valid=viewsByCat[cat]||viewsByCat.Carro;if(!valid.includes(veiView))setVeiView(valid[0]);},[veiIdx,data]);// eslint-disable-line react-hooks/exhaustive-deps
  // ──────────────────────────────────────────
  // SISTEMA DE BACKUP — Auto-save, slots, restore
  // 5 slots por matrícula, auto-save 30s, expiração 48h
  // ──────────────────────────────────────────
const saveBackup=useCallback(async()=>{if(!window.storage)return;if(savingRef.current){pendingSaveRef.current=true;return;}savingRef.current=true;window.__mvdroidIsSaving=true;setBackupStatus("💾 Salvando...");setSaveState("saving");const pfx="cq_"+loginMat+"_"+slotIdx;
// R2: snapshot slot + matrícula no início; se mudar mid-save, abortamos.
const expectedSlot=slotIdx;const expectedMat=loginMat;
const slotChanged=()=>(slotIdx!==expectedSlot||loginMat!==expectedMat);
const trySave=async(k,v)=>{if(slotChanged())return"slot-changed";try{const json=typeof v==="string"?v:JSON.stringify(v);const r=await window.storage.set(k,json);if(!r)return"fail";
// Readback verify
try{const rb=await window.storage.get(k);if(!rb||!rb.value)return"no-readback";}catch(e){return"readback-err";}
return"ok";}catch(e){return"err:"+String(e).slice(0,20);}};
try{
const snap=stateSnap.current;const main={_v:APP_VERSION,data:snap.data,vestigios:snap.vestigios,vestes:snap.vestes,papilos:snap.papilos,wounds:snap.wounds,edificacoes:snap.edificacoes,veiVest:snap.veiVest,canvasVest:snap.canvasVest,cadaveres:snap.cadaveres,veiculos:snap.veiculos,desenhos:snap.desenhos,ppm:snap.ppm,stampObjs:snap.stampObjs,trilhas:snap.trilhas,timestamp:new Date().toISOString()};
const r1=await trySave(pfx,main);
if(r1==="slot-changed"){setBackupStatus("⏭ Slot trocado — save cancelado");setSaveState("idle");return;}
if(r1!=="ok"){setBackupStatus("❌ Dados não salvos: "+r1);setSaveState("error");showToast("❌ Falha ao salvar dados ("+r1+"). Faça backup JSON manual!");return;}
// Dados OK — agora tenta salvar fotos. Se falha, NÃO finge que salvou.
let fotosStatus="ok";const _fotos=snap.fotos;if(_fotos&&_fotos.length){const rf=await trySave(pfx+"_f",_fotos);if(rf!=="ok"){fotosStatus=rf;}}
else{try{await window.storage.delete(pfx+"_f");}catch(e){console.warn("CQ backup del fotos:",e);}}
// Desenho idem
let drwStatus="ok";const drw=imgRef.current;if(drw&&Object.keys(drw).length){const rd=await trySave(pfx+"_d",drw);if(rd!=="ok")drwStatus=rd;}
else{try{await window.storage.delete(pfx+"_d");}catch(e){console.warn("CQ backup del desenho:",e);}}
// Status final reflete a verdade
if(fotosStatus==="slot-changed"||drwStatus==="slot-changed"){setBackupStatus("⏭ Slot trocado — save cancelado");setSaveState("idle");}
else if(fotosStatus==="ok"&&drwStatus==="ok"){haptic("medium");setBackupStatus("✓ S"+(slotIdx+1)+" "+new Date().toLocaleTimeString(LOCALE,{hour:"2-digit",minute:"2-digit"}));setSaveState("saved");isDirtyRef.current=false;
// v242: fotos finalmente baterem disco — banner sticky some
if(photoSaveStuckRef.current)setPhotoSaveStuck(false);}
else{const probs=[];if(fotosStatus!=="ok")probs.push("fotos:"+fotosStatus);if(drwStatus!=="ok")probs.push("desenho:"+drwStatus);setBackupStatus("⚠ Parcial — "+probs.join(", "));setSaveState("error");
// v242: se foram as FOTOS que falharam, marca photoSaveStuck.
// Banner sticky aparece e beforeunload força alerta se usuário tentar fechar.
if(fotosStatus!=="ok")setPhotoSaveStuck(true);
showToast("⚠ "+probs.join(" + ")+" — tentando novamente...");setTimeout(()=>{if(!savingRef.current)saveBackup();},3000);}
}catch(e){setBackupStatus("❌ "+String(e).slice(0,25));setSaveState("error");}finally{savingRef.current=false;window.__mvdroidIsSaving=false;if(pendingSaveRef.current){pendingSaveRef.current=false;setTimeout(()=>saveBackup(),500);}}},[loginMat,slotIdx]);
const firstSaveRef=useRef(false);
const[showStartMenu,setShowStartMenu]=useState(false);const[savedSlots,setSavedSlots]=useState([]);
const reloadSlots=useCallback(async()=>{const found=[];for(let si=0;si<5;si++){try{const bd=await loadFullSlot("cq_"+loginMat+"_"+si);if(bd)found.push({slot:si,bd});}catch(e){console.warn("CQ:",e);}}setSavedSlots(found);},[loginMat,loadFullSlot]);
const getSlot=useCallback((si)=>savedSlots.find(sl=>sl.slot===si)?.bd||null,[savedSlots]);

// Auto-save every 30 seconds + on visibility change (app background)
useEffect(()=>{if(!loggedIn)return;backupTimerRef.current=setInterval(()=>{if(!showStartMenu)saveBackup();},30000);
const onVis=()=>{if(document.visibilityState==="hidden"&&!showStartMenu)saveBackup();};document.addEventListener("visibilitychange",onVis);
return()=>{clearInterval(backupTimerRef.current);document.removeEventListener("visibilitychange",onVis);};},[saveBackup,loggedIn,loginMat,showStartMenu]);
// Save 2s after any data change or slot change
useEffect(()=>{if(!loggedIn||showStartMenu)return;isDirtyRef.current=true;setSaveState(prev=>prev==="saving"?prev:"dirty");const t=setTimeout(()=>{saveBackup();if(!firstSaveRef.current){firstSaveRef.current=true;showToast("✅ Auto-save ativo (Slot "+(slotIdx+1)+")");}},4000);return()=>clearTimeout(t);},[data,vestigios,vestes,papilos,wounds,edificacoes,veiVest,canvasVest,cadaveres,veiculos,fotos,stampObjs,desenhos,ppm,trilhas,slotIdx,loggedIn,showStartMenu]);
// Pre-load html2pdf ASSIM QUE LOGAR (evita falha de export offline na cena sem rede)
// v232: logger global de erros — captura window.error e unhandledrejection,
// salva últimas 10 ocorrências em window.__xandroidErrors (sobrevive enquanto
// app está aberto). O usuário pode acessar via tela "🔍 Diagnóstico".
useEffect(()=>{if(typeof window==="undefined")return;if(!window.__xandroidErrors)window.__xandroidErrors=[];const log=(type,err,extra)=>{try{const entry={t:new Date().toISOString(),type,msg:String(err&&err.message||err||"sem mensagem").slice(0,500),stack:String(err&&err.stack||"sem stack").slice(0,2000),extra:extra?String(extra).slice(0,300):""};window.__xandroidErrors.unshift(entry);if(window.__xandroidErrors.length>10)window.__xandroidErrors.length=10;}catch(_){}};const onErr=(ev)=>log("window.error",ev.error||ev.message,ev.filename+":"+ev.lineno);const onRej=(ev)=>log("unhandledrejection",ev.reason,"");window.addEventListener("error",onErr);window.addEventListener("unhandledrejection",onRej);return()=>{window.removeEventListener("error",onErr);window.removeEventListener("unhandledrejection",onRej);};},[]);
useEffect(()=>{if(!loggedIn||pdfReady)return;setPdfReady("loading");(async()=>{try{await loadH2P();// Pré-carrega JSZip também (background, não bloqueia)
loadJSZip().catch(e=>console.warn("CQ jszip preload:",e));setPdfReady("ok");}catch(e){console.warn("CQ pdf preload:",e);setPdfReady("fail");}})();},[loggedIn]);// eslint-disable-line react-hooks/exhaustive-deps
// Track recently used DPs (top 5) — adds to history when DP value stable for 2s

// Restore backup on mount — scan ALL slots, show start menu
useEffect(()=>{if(!loginMat||!loggedIn)return;(async()=>{
// Migrate old format (ignore errors)
try{const old=await window.storage?.get("croqui_"+loginMat);if(old&&old.value){await window.storage?.set("cq_"+loginMat+"_0",old.value);await window.storage?.delete("croqui_"+loginMat);}}catch(e){console.warn("CQ:",e);}
// List all keys in storage to diagnose persistence
let allKeys=[];try{const kl=await window.storage?.list("cq_");if(kl&&kl.keys)allKeys=kl.keys;}catch(e){console.warn("CQ:",e);}
// Scan ALL 5 slots — delete expired (>48h)
const found=[];
let expired=0;
const now=Date.now();
for(let si=0;si<5;si++){try{const bd=await loadFullSlot("cq_"+loginMat+"_"+si);if(bd){
const ts=bd.timestamp?new Date(bd.timestamp).getTime():0;
if(ts&&(now-ts)>BACKUP_EXPIRY_MS){await deleteFullSlot("cq_"+loginMat+"_"+si);expired++;continue;}
found.push({slot:si,bd});}}catch(e){console.warn("CQ:",e);}}
setSavedSlots(found);
if(found.length>0){setShowStartMenu(true);showToast("📂 "+found.length+" croqui(s)"+(expired?" | 🗑️"+expired+" expirado(s)":""));}else{
setSlotIdx(0);setBackupStatus("🆕 Novo");
showToast(allKeys.length>0?"🔑 "+allKeys.length+" chaves no storage mas nenhuma p/ mat "+loginMat:"📭 Storage vazio ("+allKeys.length+" chaves)");
setTimeout(()=>setShowTemplatePicker(true),500);
}})();},[loginMat,loggedIn]);
const resetAll=(keepLogin)=>{const p1=data.p1||loginName;const m1=data.mat_p1||loginMat;
// Quando "+ Novo croqui": tenta achar primeiro slot vazio para preservar o atual
let nextSlot=slotIdx;
if(keepLogin){const usedSlots=new Set(savedSlots.map(s=>s.slot));for(let i=0;i<5;i++){if(!usedSlots.has(i)){nextSlot=i;break;}}if(nextSlot!==slotIdx){setSlotIdx(nextSlot);showToast(`✅ Croqui anterior preservado no Slot ${slotIdx+1}. Novo croqui no Slot ${nextSlot+1}.`);}else{showToast("⚠ Todos os slots ocupados — substituindo Slot "+(slotIdx+1));}}
if(keepLogin)setData({p1,mat_p1:m1,oc_ano:""+new Date().getFullYear()});else setData({});setVestigios([{id:1,desc:"",suporte:"",coord1:"",coord2:"",altura:"",recolhido:"",destino:"",obs:"",placa:""}]);setVestes([{id:1,tipo:"",cor:"",sujidades:"",sangue:"",bolsos:"",notas:""}]);setPapilos([{id:1,desc:"",local:"",placa:""}]);setWounds([]);setEdificacoes([mkEdif()]);setVeiVest([]);setCanvasVest([]);setCadaveres([{id:1,label:"Cadáver 1"}]);setCadaverIdx(0);setVeiculos([{id:1,label:"Veículo 1"}]);setVeiIdx(0);imgRef.current={};templateRef.current=null;templatesRef.current={};setStampObjs([]);setSelStamp(null);setFotos([]);setFotoFilter("");setEdifCollapsed({});setTrilhas([]);setDesenhos([{id:1,label:"Croqui 1"}]);setDesenhoIdx(0);lineEndsRef.current=[];if(canvasRef.current&&ctxRef.current){ctxRef.current.fillStyle="#fff";ctxRef.current.fillRect(0,0,1200,850);}clearBackup();setTab(0);setResetKey(k=>k+1);setBackupStatus("🆕 Novo");setShowConfirmNovo(false);setShowStartMenu(false);if(keepLogin)setTimeout(()=>setShowTemplatePicker(true),100);};
const applyTemplate=(tplId)=>{if(!tplId){setShowTemplatePicker(false);setShowLocalPicker(false);setPendingTemplateId(null);return;}
// Se for template customizado, aplica direto (sem Local Picker)
const customTpl=customTemplates.find(t=>t.id===tplId);
if(customTpl){setData(prev=>({...prev,...customTpl.data,oc_ano:""+new Date().getFullYear()}));if(customTpl.vestigios&&customTpl.vestigios.length){setVestigios(customTpl.vestigios.map(v=>({id:uid(),desc:v.desc||"",suporte:"",coord1:"",coord2:"",altura:"",recolhido:"",destino:"",obs:v.obs||"",placa:""})));}setShowTemplatePicker(false);setPendingTemplateId(null);setResetKey(k=>k+1);showToast("✅ "+customTpl.label);haptic("heavy");return;}
setPendingTemplateId(tplId);setShowTemplatePicker(false);};
const applyTemplateAndLocal=(locId,tplIdArg)=>{const effectiveTplId=tplIdArg||pendingTemplateId;const tpl=TEMPLATES.find(t=>t.id===effectiveTplId);if(!tpl){setShowLocalPicker(false);setPendingTemplateId(null);return;}const loc=locId?LOCAIS.find(l=>l.id===locId):null;const mergedData={...tpl.data,...(loc?loc.baseData:{})};setData(prev=>({...prev,...mergedData}));let allVests=[...(tpl.vestigios||[])];if(loc&&VESTIGIOS_EXTRAS[effectiveTplId]&&VESTIGIOS_EXTRAS[effectiveTplId][locId]){allVests=[...allVests,...VESTIGIOS_EXTRAS[effectiveTplId][locId]];}if(allVests.length){setVestigios(allVests.map(v=>({id:uid(),desc:v.desc||"",suporte:"",coord1:"",coord2:"",altura:"",recolhido:"",destino:"",obs:v.obs||""})));}if(loc&&loc.createEdificacao){const edif=mkEdif(uid());if(loc.edificacaoTipo)edif.tipo=loc.edificacaoTipo;setEdificacoes([edif]);}if(loc&&loc.createTrilha){setTrilhas([{id:uid(),origem:"Via pública",destino:"Interior da residência",gps_origem:"",gps_destino:"",comprimento:"",padrao:"",continuidade:"",direcionamento:"",acumulo_qtd:"",acumulo_local:"",acumulo_vol:"",pegadas:"",arrasto:"",maos:"",satelite:"",diminuicao:"",diluicao:"",interferencia:"",interferencia_obs:"",obs:"Trilha entre via e residência — documentar trajeto"}]);}showToast(`✅ ${tpl.label}${loc?" • "+loc.label:""}`);haptic("heavy");setShowLocalPicker(false);setPendingTemplateId(null);setResetKey(k=>k+1);};
// Transição de template → próximo passo (auto-apply ou picker de local).
// Substitui dois setTimeout mágicos (50ms/150ms) que tinham race conditions em tablets lentos.
useEffect(()=>{if(!pendingTemplateId||showTemplatePicker)return;const tpl=TEMPLATES.find(t=>t.id===pendingTemplateId);if(!tpl)return;if(tpl.forceLocal){applyTemplateAndLocal(tpl.forceLocal,pendingTemplateId);}else if(!showLocalPicker){setShowLocalPicker(true);}},[pendingTemplateId,showTemplatePicker]);// eslint-disable-line react-hooks/exhaustive-deps
const doLogin=()=>{const trimMat=(loginMat||"").trim();if(!trimMat)return;const detected=lookupPerito(trimMat);const trimName=detected||toTitleCase((loginName||"").trim());setLoginName(trimName);setLoginMat(trimMat);setLoggedIn(true);setData(prev=>({...prev,p1:trimName,mat_p1:trimMat,oc_ano:prev.oc_ano||""+new Date().getFullYear()}));// Salva esta matrícula como a última (para pré-carregar tema na próxima abertura)
(async()=>{try{await window.storage?.set("cq_last_mat",trimMat);}catch(e){console.warn("CQ last mat:",e);}})();// Carrega preferência de tema salva para esta matrícula
(async()=>{try{const pref=await window.storage?.get("cq_pref_dark_"+trimMat);if(pref&&pref.value==="1")setDark(true);else if(pref&&pref.value==="0")setDark(false);const prefAc=await window.storage?.get("cq_pref_accent_"+trimMat);if(prefAc&&prefAc.value==="pink")setAccent("pink");else setAccent("blue");}catch(e){console.warn("CQ pref:",e);}})();// Carrega templates personalizados
(async()=>{try{const saved=await window.storage?.get("cq_tpl_"+trimMat);if(saved&&saved.value){const arr=JSON.parse(saved.value);if(Array.isArray(arr))setCustomTemplates(arr);}}catch(e){console.warn("CQ tpl load:",e);}})();};
// Persiste escolha de tema (dark/claro) para a matrícula ativa
useEffect(()=>{if(!loggedIn||!loginMat)return;(async()=>{try{await window.storage?.set("cq_pref_dark_"+loginMat,dark?"1":"0");}catch(e){console.warn("CQ pref save:",e);}})();},[dark,loggedIn,loginMat]);
useEffect(()=>{if(!loggedIn||!loginMat)return;(async()=>{try{await window.storage?.set("cq_pref_accent_"+loginMat,accent);}catch(e){console.warn("CQ accent save:",e);}})();},[accent,loggedIn,loginMat]);
useEffect(()=>{if(accent==="pink")document.body.classList.add("accent-pink");else document.body.classList.remove("accent-pink");return()=>document.body.classList.remove("accent-pink");},[accent]);
// Pré-carrega tema (dark + accent) da última matrícula que fez login (antes de logar de novo)
useEffect(()=>{(async()=>{try{const last=await window.storage?.get("cq_last_mat");if(!last||!last.value)return;const lastMat=last.value;setLoginMat(lastMat);const pref=await window.storage?.get("cq_pref_dark_"+lastMat);if(pref&&pref.value==="1")setDark(true);else if(pref&&pref.value==="0")setDark(false);const prefAc=await window.storage?.get("cq_pref_accent_"+lastMat);if(prefAc&&prefAc.value==="pink")setAccent("pink");else if(prefAc&&prefAc.value==="blue")setAccent("blue");}catch(e){console.warn("CQ pre-load theme:",e);}})();},[]);
// Salva template atual (estrutura/dados genéricos, sem número de ocorrência nem fotos)
const saveCustomTemplate=async()=>{const name=(tplNameInput||"").trim();if(!name){showToast("⚠ Digite um nome");return;}// Extrai só campos reutilizáveis dos dados atuais (exclui os que mudam por ocorrência)
const EXCLUDE_KEYS=["oc","oc_ano","data_fato","hora_fato","data_peric","hora_peric","endereco","coord_lat","coord_lng","lat","lng","p2","mat_p2","dp"];
const pickData={};Object.keys(data||{}).forEach(k=>{const excluded=EXCLUDE_KEYS.some(ex=>k===ex||k.endsWith("_"+ex));if(!excluded)pickData[k]=data[k];});
// Template só guarda vestígios com desc preenchida (sem coordenadas/placas)
const tplVests=(vestigios||[]).filter(v=>v&&v.desc).map(v=>({desc:v.desc,obs:v.obs||""}));
const newTpl={id:"custom_"+Date.now(),label:name,description:(tplDescInput||"").trim()||"Template pessoal",icon:"💾",custom:true,data:pickData,vestigios:tplVests,timestamp:Date.now()};
const updated=[...customTemplates,newTpl];setCustomTemplates(updated);
try{await window.storage?.set("cq_tpl_"+loginMat,JSON.stringify(updated));showToast("✅ Template \""+name+"\" salvo");haptic("heavy");}catch(e){showToast("❌ Falha ao salvar template");return;}
setShowSaveTemplate(false);setTplNameInput("");setTplDescInput("");};
// Remove template personalizado
const deleteCustomTemplate=async(tplId)=>{const updated=customTemplates.filter(t=>t.id!==tplId);setCustomTemplates(updated);try{await window.storage?.set("cq_tpl_"+loginMat,JSON.stringify(updated));showToast("🗑️ Template removido");}catch(e){console.warn("CQ tpl del:",e);}};
const applyBackupData=(bd)=>{
// VALIDAÇÃO: backup importado é dado externo. Sanitiza tudo antes de aplicar.
if(!bd||typeof bd!=="object"){showToast("❌ Backup inválido: estrutura corrompida");return;}
const safeArr=(v,defaultArr,checkItem)=>{if(!Array.isArray(v))return defaultArr;return v.filter(x=>x&&typeof x==="object"&&(!checkItem||checkItem(x)));};
// fillDefaults: garante que cada item do array tem todos os campos esperados
const fillDefaults=(arr,defaults)=>arr.map(item=>({...defaults,...item,id:item.id??uid()}));
const dataIn=(bd.data&&typeof bd.data==="object")?bd.data:((bd.dados&&typeof bd.dados==="object")?bd.dados:{});
// Migração: campo p2 antigo era select com "Outro" + p2_outro. Agora p2 é direto.
if(dataIn.p2==="Outro"&&dataIn.p2_outro){dataIn.p2=toTitleCase(dataIn.p2_outro);delete dataIn.p2_outro;}
else if(dataIn.p2&&typeof dataIn.p2==="string"&&dataIn.p2===dataIn.p2.toUpperCase()&&dataIn.p2.length>1){dataIn.p2=toTitleCase(dataIn.p2);}
// Se mat_p2 ausente mas p2 cadastrado, tenta achar matrícula reversa
if(!dataIn.mat_p2&&dataIn.p2&&typeof dataIn.p2==="string"){const found=Object.entries(PERITOS).find(([m,n])=>n.toLowerCase()===dataIn.p2.toLowerCase());if(found)dataIn.mat_p2=found[0];}
try{
// Aplica defaults para campos críticos faltantes (compatibilidade com backups antigos)
const dataWithDefaults={oc_ano:""+new Date().getFullYear(),...dataIn};
setData(dataWithDefaults);
// Defaults por item (garante todos os campos esperados em cada entry)
const VEST_DEF={desc:"",suporte:"",coord1:"",coord2:"",altura:"",recolhido:"",destino:"",obs:"",placa:""};
const VESTE_DEF={tipo:"",cor:"",sujidades:"",sangue:"",bolsos:"",notas:"",cadaver:0};
const PAPILO_DEF={desc:"",local:"",placa:""};
const TRILHA_DEF={origem:"",destino:"",gps_origem:"",gps_destino:"",comprimento:"",padrao:"",continuidade:"",direcionamento:"",acumulo_qtd:"",acumulo_local:"",acumulo_vol:"",pegadas:"",arrasto:"",maos:"",satelite:"",diminuicao:"",diluicao:"",interferencia:"",interferencia_obs:"",obs:""};
const CADAVER_DEF={label:"Cadáver"};
const VEICULO_DEF={label:"Veículo"};
const DESENHO_DEF={label:"Croqui"};
setVestigios(fillDefaults(safeArr(bd.vestigios,[{id:1,...VEST_DEF}]),VEST_DEF));
setVestes(fillDefaults(safeArr(bd.vestes,[{id:1,...VESTE_DEF}]),VESTE_DEF));
setPapilos(fillDefaults(safeArr(bd.papilos,[{id:1,...PAPILO_DEF}]),PAPILO_DEF));
setWounds(safeArr(bd.wounds,[]));
setEdificacoes(safeArr(bd.edificacoes,[mkEdif()]).map(e=>({...mkEdif(),...e,id:e.id??uid()})));
setVeiVest(safeArr(bd.veiVest,[]));
setCanvasVest(fillDefaults(safeArr(bd.canvasVest,[]),VEST_DEF));
setCadaveres(fillDefaults(safeArr(bd.cadaveres,[{id:1,label:"Cadáver 1"}],c=>c.id!==null),CADAVER_DEF));
setVeiculos(fillDefaults(safeArr(bd.veiculos,[{id:1,label:"Veículo 1"}],c=>c.id!==null),VEICULO_DEF));
// v235: valida desenhos — só aceita strings que sejam data:image/* ou blob:
// (mesmo motivo da validação de fotos abaixo).
const isSafeDrawing=(u)=>typeof u==="string"&&(/^data:image\//i.test(u)||/^blob:/i.test(u));
if(bd.desenho){if(typeof bd.desenho==="string"){imgRef.current=isSafeDrawing(bd.desenho)?{0:bd.desenho}:{};}else if(typeof bd.desenho==="object"&&bd.desenho!==null){const safe={};for(const k of Object.keys(bd.desenho)){if(isSafeDrawing(bd.desenho[k]))safe[k]=bd.desenho[k];}imgRef.current=safe;}else{imgRef.current={};}}else{imgRef.current={};}
setDesenhos(fillDefaults(safeArr(bd.desenhos,[{id:1,label:"Croqui 1"}],d=>d.id!==null),DESENHO_DEF));
setPpm(typeof bd.ppm==="number"&&bd.ppm>0?bd.ppm:40);
// v245: upgrader — stamps antigos foram criados com sz=50 fixo, que vira ~16pt
// no celular (abaixo do mínimo 44pt iOS HIG). Aumenta pra 80 mantendo tudo
// editável. Não afeta croquis novos (já nascem com getStampSz dinâmico).
setStampObjs(safeArr(bd.stampObjs,[]).map(s=>({...s,sz:Math.max(s.sz||50,80)})));
// v235: valida URL da foto — só aceita data:image/* ou blob: pra impedir
// que backup malicioso injete javascript: ou esquemas estranhos.
const isSafeImgUrl=(u)=>typeof u==="string"&&(/^data:image\//i.test(u)||/^blob:/i.test(u));
setFotos(safeArr(bd.fotos,[],f=>isSafeImgUrl(f.dataUrl)));
setTrilhas(fillDefaults(safeArr(bd.trilhas,[]),TRILHA_DEF));
setResetKey(k=>k+1);
}catch(err){console.error("CQ applyBackup:",err);showToast("❌ Erro ao restaurar: "+String(err.message||err).slice(0,50));}};

const clearBackup=async()=>{try{await deleteFullSlot("cq_"+loginMat+"_"+slotIdx);}catch(e){console.warn("CQ:",e);}setShowStartMenu(false);};
const tabs=[{l:"Solicitação",i:"📋"},{l:"Local",i:"📍"},{l:"Vestígios",i:"🧪"},{l:"Cadáver",i:"🏥"},{l:"Veículo",i:"🚗"},{l:"Exportar",i:"💾"},{l:"Desenho",i:"✏️"}];
const t=useMemo(()=>{const isPink=accent==="pink";const acDark=isPink?"#e85b8a":"#0a84ff";const acLight=isPink?"#d6336c":"#0066cc";const abDark=isPink?"rgba(232,91,138,0.14)":"rgba(10,132,255,0.12)";const abLight=isPink?"rgba(214,51,108,0.10)":"rgba(0,102,204,0.1)";const infoBgDark=isPink?"#1f0e18":"#0f1320";const infoBgSDark=isPink?"#2a1424":"#1a1a2e";const infoBdDark=isPink?"#4a1f36":"#2a2a4e";const infoBgLight=isPink?"#fff0f5":"#f0f4ff";const infoBgSLight=isPink?"#ffe8f0":"#eef3ff";const infoBdLight=isPink?"#f0c0d4":"#c8d6e5";return dark?{bg:"#000",bg2:"#1c1c1e",bg3:"#2c2c2e",bg4:"#3a3a3c",bd:"#38383a",tx:"#fff",t2:"#d4d4d8",t3:"#9a9aa0",ac:acDark,ab:abDark,ok:"#30d158",no:"#ff453a",wn:"#ffd60a",cd:"#1c1c1e",dangerBg:"#1f0e0e",dangerBgS:"#2a1410",dangerBd:"#442222",warningBg:"#2a2000",warningBd:"#553f00",successBg:"#0f1a0f",successBgS:"#1a2a1a",successBd:"#2a4a2a",infoBg:infoBgDark,infoBgS:infoBgSDark,infoBd:infoBdDark}:{bg:"#f2f2f7",bg2:"#fff",bg3:"#e5e5ea",bg4:"#d1d1d6",bd:"#c6c6c8",tx:"#000",t2:"#3c3c43",t3:"#6c6c70",ac:acLight,ab:abLight,ok:"#1f7a30",no:"#d12822",wn:"#8a5a00",cd:"#fff",dangerBg:"#fff5f5",dangerBgS:"#fff4f0",dangerBd:"#ffcccc",warningBg:"#fff8e1",warningBd:"#ffc107",successBg:"#f0f9f0",successBgS:"#e8f5e9",successBd:"#81c784",infoBg:infoBgLight,infoBgS:infoBgSLight,infoBd:infoBdLight};},[dark,accent]);
  // ──────────────────────────────────────────
  // EFEITO — Login: carrega backup e slots
  // ──────────────────────────────────────────
const {inp,sel,ta,lb,ch,tY,tN,bt,abtn,tb,segTab,segContainer,ST}=useMemo(()=>{const inp={width:"100%",background:t.bg3,border:`1.5px solid ${t.bd}`,borderRadius:10,padding:"11px 14px",fontSize:17,color:t.tx,fontFamily:"inherit",outline:"none",transition:"box-shadow 0.15s",boxSizing:"border-box"};
const sel={...inp,appearance:"none",WebkitAppearance:"none",MozAppearance:"none",minHeight:44,paddingRight:34,backgroundImage:`url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='${encodeURIComponent(t.t2)}' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",backgroundSize:"12px 12px",cursor:"pointer"};const ta={...inp,resize:"vertical",minHeight:72,lineHeight:1.45};
const lb={fontSize:13,fontWeight:600,color:t.t2,textTransform:"uppercase",letterSpacing:0.4,marginBottom:6,marginLeft:0,paddingLeft:4,display:"block"};
const ch=a=>({padding:"7px 14px",fontSize:14,borderRadius:20,border:`1px solid ${a?t.ac:t.bd}`,background:a?t.ab:"transparent",color:a?t.ac:t.t2,cursor:"pointer",fontFamily:"inherit",fontWeight:a?600:400,transition:"background 0.15s ease,border-color 0.15s ease,color 0.15s ease",animation:a?"snPickPop 0.35s cubic-bezier(0.34,1.56,0.64,1)":"none"});
const tY=a=>({padding:"7px 16px",fontSize:13,border:`1px solid ${a?t.ok:t.bd}`,background:a?"rgba(48,209,88,0.15)":"transparent",color:a?t.ok:t.t3,cursor:"pointer",fontFamily:"inherit",fontWeight:500,borderRadius:"8px 0 0 8px"});
const tN=a=>({padding:"7px 16px",fontSize:13,border:`1px solid ${a?t.no:t.bd}`,background:a?"rgba(255,69,58,0.15)":"transparent",color:a?t.no:t.t3,cursor:"pointer",fontFamily:"inherit",fontWeight:500,borderRadius:"0 8px 8px 0"});
const bt={padding:"11px 20px",fontSize:15,fontWeight:600,letterSpacing:-0.2,borderRadius:11,cursor:"pointer",fontFamily:"inherit",border:"none",backgroundImage:"linear-gradient(180deg,rgba(255,255,255,0.16) 0%,rgba(255,255,255,0) 50%,rgba(0,0,0,0.06) 100%)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.18),0 1px 2px rgba(0,0,0,0.16),0 0 0 0.5px rgba(0,0,0,0.06)"};
const abtn={width:"100%",padding:"14px",fontSize:14,fontWeight:600,letterSpacing:-0.2,background:dark?"linear-gradient(180deg,#1f1f22 0%,#141416 100%)":"linear-gradient(180deg,#ffffff 0%,#fafbfc 100%)",border:`1.5px solid ${t.ac}55`,color:t.ac,cursor:"pointer",borderRadius:14,fontFamily:"inherit",boxShadow:dark?`0 2px 10px rgba(10,132,255,0.18),inset 0 1px 0 rgba(255,255,255,0.05)`:`0 2px 10px rgba(0,122,255,0.12),inset 0 1px 0 rgba(255,255,255,0.8)`,position:"relative",overflow:"hidden",transition:"all 0.2s cubic-bezier(0.34,1.56,0.64,1)"};
const tb=a=>({padding:"7px 12px",fontSize:12,background:a?t.ac:"transparent",border:`1px solid ${a?t.ac:t.bd}`,color:a?"#fff":t.t2,cursor:"pointer",borderRadius:8,fontFamily:"inherit",fontWeight:a?600:500,display:"inline-flex",alignItems:"center",gap:4,transition:"all 0.15s",boxShadow:a?"0 1px 2px rgba(0,0,0,0.08)":"none"});
// segTab: estilo segmented control iOS p/ sub-abas principais (cadáver, veículo, desenho)
const segTab=a=>({padding:"8px 16px",fontSize:13,background:a?t.cd:"transparent",border:"none",color:a?t.tx:t.t2,cursor:"pointer",borderRadius:7,fontFamily:"inherit",fontWeight:a?700:500,boxShadow:a?(dark?"0 1px 2px rgba(0,0,0,0.6)":"0 1px 3px rgba(0,0,0,0.12)"):"none",transition:"all 0.2s",whiteSpace:"nowrap"});
const segContainer={display:"inline-flex",background:t.bg3,borderRadius:9,padding:3,gap:2,overflowX:"auto",maxWidth:"100%"};
const ST={inp,sel,ta,lb,ch,tY,tN,bt,ac:t.ac,cd:t.cd,bd:t.bd,tx:t.tx,t2:t.t2,t3:t.t3,bg3:t.bg3,hdbg:dark?"#1c1c1e":"#f8f8fa",dark,segTab,segContainer,accentMode:accent};
return{inp,sel,ta,lb,ch,tY,tN,bt,abtn,tb,segTab,segContainer,ST};},[t,dark]);
const scrollTop=useCallback(()=>setTimeout(()=>{window.scrollTo({top:0,behavior:"instant"});document.documentElement.scrollTop=0;document.body.scrollTop=0;},50),[]);
const swipeRef=useRef(null);const onSwipeStart=(e)=>{if(tab===TAB_DESENHO)return;swipeRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY};};const onSwipeEnd=(e)=>{if(!swipeRef.current||tab===TAB_DESENHO)return;const dx=e.changedTouches[0].clientX-swipeRef.current.x;const dy=e.changedTouches[0].clientY-swipeRef.current.y;swipeRef.current=null;if(Math.abs(dy)>Math.abs(dx))return;if(dx<-80&&tab<tabs.length-1){requestAnimationFrame(()=>{setTabDir("r");setTab(tab+1);scrollTop();});}else if(dx>80&&tab>0){requestAnimationFrame(()=>{setTabDir("l");setTab(tab-1);scrollTop();});}};
// v224: refs e efeito que garantem que a aba ATIVA sempre fique visível na barra de abas.
// Corrige bug do iOS Safari onde justify-content:center com overflow recorta a primeira aba.
const tabsBarRef=useRef(null);const activeTabRef=useRef(null);
// v225: scroll horizontal direto da barra (não scrollIntoView, que tem bug em fixed
// no iOS Safari e às vezes rola o documento em vez da barra). Garante que a aba
// ativa fica centralizada na barra após login e em qualquer mudança de aba.
useEffect(()=>{if(!loggedIn)return;const apply=()=>{const bar=tabsBarRef.current;const btn=activeTabRef.current;if(!bar||!btn||!bar.isConnected||!btn.isConnected)return;const targetLeft=btn.offsetLeft-(bar.clientWidth-btn.offsetWidth)/2;const finalLeft=Math.max(0,targetLeft);try{bar.scrollTo({left:finalLeft,behavior:"smooth"});}catch(e){bar.scrollLeft=finalLeft;}};requestAnimationFrame(apply);const id=setTimeout(apply,250);return()=>clearTimeout(id);},[tab,loggedIn]);
const camBtn=()=>{const tabRks={[TAB_SOLICITACAO]:"solicitacao",[TAB_LOCAL]:"local",[TAB_VESTIGIOS]:"vestigios",[TAB_CADAVER]:"cadaver",[TAB_VEICULO]:"veiculo"};const rk=tabRks[tab]||"geral";return <button type="button" title="Tirar foto" aria-label="Tirar foto da aba atual" onClick={()=>pickFile({accept:"image/*",capture:"environment",onPick:async(fls)=>{const legend=mkAutoLegend(rk);const gps=await captureGPS();const novas=[];for(const fl of fls){try{const foto=await compressImg(fl,{hq:fotoHQ});novas.push({id:uid(),ref:rk,desc:legend.desc,fase:"",local:legend.local,...foto,...(gps?{gps}:{})});}catch(e){console.warn("CQ:",e);}}if(novas.length){setFotos(p=>[...p,...novas]);haptic("heavy");showToast("📷 "+novas.length+" foto"+(novas.length>1?"s":"")+(gps?" 📍":""));}}})} style={{width:48,height:48,borderRadius:"50%",background:t.ac,color:"#fff",border:"none",boxShadow:"0 2px 10px rgba(0,122,255,0.3)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}><Camera size={22} strokeWidth={2.2}/></button>;};
const navBtns=()=>(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0",gap:12}}>{tab>0?<button type="button" style={{...bt,background:t.bg3,border:`1px solid ${t.bd}`,color:t.tx,display:"flex",alignItems:"center",gap:6}} aria-label="Aba anterior" onClick={()=>{if(tab<=0)return;haptic("selection");requestAnimationFrame(()=>{setTabDir("l");setTab(tab-1);scrollTop();});}}><ChevronLeft size={16}/>Anterior</button>:<div style={{width:100}}/>}{camBtn()}{tab<tabs.length-1?<button type="button" style={{...bt,background:t.ac,color:"#fff",display:"flex",alignItems:"center",gap:6}} aria-label="Próxima aba" onClick={()=>{if(tab>=tabs.length-1)return;haptic("selection");requestAnimationFrame(()=>{setTabDir("r");setTab(tab+1);scrollTop();});}}>Próximo<ChevronRight size={16}/></button>:<div style={{width:100}}/>}</div>);
const doGPS=()=>{setGpsLoading(true);
if(navigator.geolocation){
navigator.geolocation.getCurrentPosition(
p=>{const v=`${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`;s("gps",v);if(gpsRef.current)gpsRef.current.value=v;setGpsLoading(false);haptic("heavy");showToast("✅ GPS capturado: "+v);
// Reverse geocoding (Nominatim) with timeout
try{const ac=new AbortController();const tid=setTimeout(()=>ac.abort(),6000);fetch(`https://nominatim.openstreetmap.org/reverse?lat=${p.coords.latitude}&lon=${p.coords.longitude}&format=json&addressdetails=1`,{headers:{"Accept-Language":"pt-BR"},signal:ac.signal}).then(r=>{clearTimeout(tid);return r.json();}).then(j=>{if(j&&j.display_name&&!data.end){const addr=j.display_name;s("end",addr);showToast("📍 Endereço: "+addr.slice(0,50)+"…");}}).catch(e=>{clearTimeout(tid);if(e.name!=="AbortError")console.warn("CQ geocoding:",e);});}catch(e){console.warn("CQ geocoding init:",e);}},
// v242: distinguir 3 erros possíveis pra dar mensagem específica ao perito
// (PERMISSION_DENIED=1, POSITION_UNAVAILABLE=2, TIMEOUT=3 — spec W3C Geolocation)
(err)=>{setGpsLoading(false);s("gps_fallback","1");
const code=err&&err.code;
if(code===1){showToast("🔒 GPS bloqueado — libere a permissão nas Ajustes do navegador");}
else if(code===3){showToast("⏱ GPS demorou demais — saia pro descampado e tente de novo");}
else{showToast("📍 GPS indisponível — digite as coordenadas manualmente");}
console.warn("CQ GPS error:",code,err&&err.message);},
{enableHighAccuracy:true,timeout:8000,maximumAge:0}
);}else{setGpsLoading(false);s("gps_fallback","1");showToast("📍 GPS não suportado neste dispositivo");}
};
const aw=id=>{const r=AR.find(x=>x.id===id);setWounds(w=>[...w,{id:uid(),cadaver:cadaverIdx,region:id,regionLabel:r?.l||id,tipo:"",obs:""}]);};
const wc=id=>wounds.filter(w=>w.region===id&&w.cadaver===cadaverIdx).length;
const addVV=(rid,label)=>{const r=AV.find(x=>x.id===rid);setVeiVest(v=>[...v,{id:uid(),veiculo:veiIdx,region:rid,regionLabel:r?.l||label||rid,tipo:"",obs:"",recolhido:"",destino:""}]);};
const vwc=id=>veiVest.filter(v=>v.region===id&&(v.veiculo===undefined||v.veiculo===veiIdx)).length;

// Canvas
useEffect(()=>{if(tab!==TAB_DESENHO)return;const c=canvasRef.current;if(!c)return;const ctx=c.getContext("2d");ctxRef.current=ctx;const curImg=imgRef.current[desenhoIdx];templateRef.current=templatesRef.current[desenhoIdx]||null;const loadedRef={current:!curImg};const dirtyRef={current:false};canvasLoadedRef.current=loadedRef;canvasDirtyRef.current=dirtyRef;if(curImg){const im=new Image();im.onload=()=>{ctx.drawImage(im,0,0);loadedRef.current=true;};im.onerror=()=>{loadedRef.current=true;};im.src=curImg;}else{ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);if(templateRef.current)ctx.putImageData(templateRef.current,0,0);}histRef.current=[];return()=>{if(canvasRef.current&&loadedRef.current){try{const tmp=document.createElement("canvas");tmp.width=1200;tmp.height=850;const tc=tmp.getContext("2d");tc.drawImage(canvasRef.current,0,0);if(overlayRef.current)tc.drawImage(overlayRef.current,0,0);imgRef.current[desenhoIdx]=tmp.toDataURL();}catch(e){console.warn("CQ canvas save:",e);}}};},[tab,desenhoIdx]);
// Pinch-to-zoom on canvas
const zoomRef=useRef(zoomLvl);zoomRef.current=zoomLvl;
useEffect(()=>{if(tab!==TAB_DESENHO)return;const el=canvasScrollRef.current;if(!el)return;const getDist=(t1,t2)=>Math.hypot(t1.clientX-t2.clientX,t1.clientY-t2.clientY);const onTS=(e)=>{if(e.touches.length===2){e.preventDefault();pinchRef.current={dist:getDist(e.touches[0],e.touches[1]),zoom:zoomRef.current};}};const onTM=(e)=>{if(e.touches.length===2&&pinchRef.current){e.preventDefault();const newDist=getDist(e.touches[0],e.touches[1]);const scale=newDist/pinchRef.current.dist;const nz=Math.max(0.5,Math.min(3,pinchRef.current.zoom*scale));setZoomLvl(Math.round(nz*4)/4);}};const onTE=()=>{pinchRef.current=null;};el.addEventListener("touchstart",onTS,{passive:false});el.addEventListener("touchmove",onTM,{passive:false});el.addEventListener("touchend",onTE);return()=>{el.removeEventListener("touchstart",onTS);el.removeEventListener("touchmove",onTM);el.removeEventListener("touchend",onTE);};},[tab]);
  // ──────────────────────────────────────────
  // CANVAS — Renderização de stamps (overlay)
  // drawStamp: desenha cada tipo de stamp no canvas
  // renderOverlay: redesenha todos os stamps
  // ──────────────────────────────────────────
const tabRef=useRef(0);tabRef.current=tab;
// v246: getBtnRadius — raio dos botões circulares (delete/rotate/resize) escalado
// pelo zoom do canvas em relação à tela. No celular vira ~44pt mínimo (Fitts/HIG).
const getBtnRadius=()=>{const c=canvasRef.current;if(!c)return 32;const r=c.getBoundingClientRect();if(!r||r.width<1)return 32;const scale=1200/r.width;return Math.max(32,Math.round(scale*22));};
const renderOverlay=useCallback(()=>{if(tabRef.current!==TAB_DESENHO)return;const oc=overlayRef.current;if(!oc)return;const ctx=oc.getContext("2d");ctx.clearRect(0,0,1200,850);const myStamps=(stampObjs||[]).filter(s=>s.sheet===desenhoIdx);
// v246: tol e hR DINÂMICOS — mesma fórmula usada por onD/hitStamp.
// Antes o overlay desenhava o botão em hf=+14 e o onD procurava em hf=+getHitTol() (~46 no celular).
// Agora os dois usam o mesmo hf e o mesmo hR — o usuário toca exatamente onde vê o botão.
const tol=getHitTol();const hR=getBtnRadius();
myStamps.forEach((s,i)=>{ctx.save();ctx.translate(s.x,s.y);ctx.rotate((s.rot||0)*Math.PI/180);ds(ctx,s.type,0,0,s.color||"#000",s.sz||50);ctx.restore();if(selStamp===s.id){ctx.save();ctx.strokeStyle="#007aff";ctx.lineWidth=3;ctx.setLineDash([8,6]);const hf=(s.sz||50)/2+tol;ctx.strokeRect(s.x-hf,s.y-hf,hf*2,hf*2);ctx.setLineDash([]);
// botão DELETE (vermelho, "X") em top-right
ctx.fillStyle="#ff3b30";ctx.beginPath();ctx.arc(s.x+hf,s.y-hf,hR,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=Math.max(4,hR/8);const xL=hR*0.4;ctx.beginPath();ctx.moveTo(s.x+hf-xL,s.y-hf-xL);ctx.lineTo(s.x+hf+xL,s.y-hf+xL);ctx.moveTo(s.x+hf+xL,s.y-hf-xL);ctx.lineTo(s.x+hf-xL,s.y-hf+xL);ctx.stroke();
// botão ROTATE (azul, "↻") em bottom-left
ctx.fillStyle="#007aff";ctx.beginPath();ctx.arc(s.x-hf,s.y+hf,hR,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.font=`bold ${Math.round(hR*1.1)}px sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("↻",s.x-hf,s.y+hf+2);
// botão RESIZE (verde, setas diagonais) em bottom-right
ctx.fillStyle="#34c759";ctx.beginPath();ctx.arc(s.x+hf,s.y+hf,hR,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=Math.max(4,hR/8);const aL=hR*0.32;const aT=hR*0.16;ctx.beginPath();ctx.moveTo(s.x+hf-aL,s.y+hf-aL);ctx.lineTo(s.x+hf+aL,s.y+hf+aL);ctx.moveTo(s.x+hf+aL,s.y+hf+aT);ctx.lineTo(s.x+hf+aL,s.y+hf+aL);ctx.lineTo(s.x+hf+aT,s.y+hf+aL);ctx.moveTo(s.x+hf-aL,s.y+hf-aT);ctx.lineTo(s.x+hf-aL,s.y+hf-aL);ctx.lineTo(s.x+hf-aT,s.y+hf-aL);ctx.stroke();
ctx.restore();}});},[stampObjs,selStamp,desenhoIdx]);
useEffect(()=>{renderOverlay();},[renderOverlay]);
// v246: re-renderiza overlay em resize/orientation pra atualizar tol/hR dinâmicos
useEffect(()=>{const onR=()=>renderOverlay();window.addEventListener("resize",onR);window.addEventListener("orientationchange",onR);return()=>{window.removeEventListener("resize",onR);window.removeEventListener("orientationchange",onR);};},[renderOverlay]);
const svTimerRef=useRef(null);const sv=()=>{canvasDirtyRef.current.current=true;if(svTimerRef.current)cancelAnimationFrame(svTimerRef.current);svTimerRef.current=requestAnimationFrame(()=>{if(!canvasRef.current)return;const tmp=document.createElement("canvas");tmp.width=1200;tmp.height=850;const tc=tmp.getContext("2d");tc.drawImage(canvasRef.current,0,0);if(overlayRef.current)tc.drawImage(overlayRef.current,0,0);imgRef.current[desenhoIdx]=tmp.toDataURL();});};
// Force-flush canvas to imgRef synchronously (use before export)
const forceSaveCanvas=()=>{if(svTimerRef.current){cancelAnimationFrame(svTimerRef.current);svTimerRef.current=null;}if(!canvasRef.current||!canvasLoadedRef.current?.current)return;try{const tmp=document.createElement("canvas");tmp.width=1200;tmp.height=850;const tc=tmp.getContext("2d");tc.drawImage(canvasRef.current,0,0);if(overlayRef.current)tc.drawImage(overlayRef.current,0,0);imgRef.current[desenhoIdx]=tmp.toDataURL();}catch(e){console.warn("CQ forceSave:",e);}};
const pH2=()=>{if(canvasRef.current){histRef.current=[...histRef.current.slice(-20),canvasRef.current.toDataURL("image/jpeg",0.7)];redoRef.current=[];}};
const cp=e=>{const c=canvasRef.current;if(!c)return{x:0,y:0};const r=c.getBoundingClientRect();const cx=e.clientX!==undefined?e.clientX:(e.touches?.[0]?.clientX||0);const cy=e.clientY!==undefined?e.clientY:(e.touches?.[0]?.clientY||0);return{x:(cx-r.left)*(c.width/r.width),y:(cy-r.top)*(c.height/r.height)};};
const ds=(ctx,nm,x,y,cl,sz2)=>{ctx.save();ctx.lineCap="round";ctx.lineJoin="round";const hf=sz2/2;if(nm==="arma"){ctx.strokeStyle=cl;ctx.fillStyle="#444";ctx.lineWidth=1.5;const s=hf/14;
ctx.beginPath();ctx.moveTo(x-20*s,y-1*s);ctx.lineTo(x+8*s,y-1*s);ctx.lineTo(x+12*s,y-5*s);ctx.lineTo(x+20*s,y-5*s);ctx.lineTo(x+20*s,y+1*s);ctx.lineTo(x+12*s,y+1*s);ctx.lineTo(x+8*s,y+1*s);ctx.lineTo(x+8*s,y+3*s);ctx.quadraticCurveTo(x+6*s,y+6*s,x+3*s,y+14*s);ctx.lineTo(x-2*s,y+14*s);ctx.quadraticCurveTo(x+1*s,y+6*s,x+2*s,y+3*s);ctx.lineTo(x-6*s,y+3*s);ctx.lineTo(x-6*s,y+1*s);ctx.lineTo(x-20*s,y+1*s);ctx.closePath();ctx.fill();ctx.stroke();
ctx.fillStyle=cl;ctx.beginPath();ctx.arc(x+17*s,y-2*s,1.5*s,0,Math.PI*2);ctx.fill();
ctx.strokeStyle="#666";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-20*s,y-3*s);ctx.lineTo(x-14*s,y-3*s);ctx.lineTo(x-14*s,y-1*s);ctx.stroke();
ctx.beginPath();ctx.moveTo(x+4*s,y+3*s);ctx.lineTo(x+8*s,y+8*s);ctx.lineTo(x+2*s,y+8*s);ctx.closePath();ctx.stroke();}else if(nm==="sangue"){ctx.fillStyle="#cc0000";ctx.strokeStyle="#990000";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y-hf);ctx.bezierCurveTo(x-hf*.9,y-hf*.2,x-hf,y+hf*.4,x,y+hf);ctx.bezierCurveTo(x+hf,y+hf*.4,x+hf*.9,y-hf*.2,x,y-hf);ctx.fill();ctx.stroke();ctx.fillStyle="rgba(255,255,255,0.3)";ctx.beginPath();ctx.ellipse(x-hf*.2,y-hf*.1,hf*.15,hf*.25,-.5,0,Math.PI*2);ctx.fill();for(let i=0;i<3;i++){const a=[0.8,2.9,5.1][i];const r2=hf*[0.5,0.6,0.4][i];ctx.fillStyle="#cc0000";ctx.beginPath();ctx.arc(x+Math.cos(a)*r2,y+Math.sin(a)*r2+hf*.5,[3,2.5,3.5][i],0,Math.PI*2);ctx.fill();}}else if(nm==="pessoaEmPe"){ctx.strokeStyle=cl;ctx.lineWidth=1.8;const s2=hf/20;
ctx.beginPath();ctx.arc(x,y-16*s2,5*s2,0,Math.PI*2);ctx.fillStyle="#f5efe8";ctx.fill();ctx.stroke();
ctx.beginPath();ctx.moveTo(x,y-11*s2);ctx.lineTo(x,y+4*s2);ctx.stroke();
ctx.beginPath();ctx.moveTo(x,y-8*s2);ctx.lineTo(x-10*s2,y-2*s2);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y-8*s2);ctx.lineTo(x+10*s2,y-2*s2);ctx.stroke();
ctx.beginPath();ctx.moveTo(x,y+4*s2);ctx.lineTo(x-7*s2,y+18*s2);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y+4*s2);ctx.lineTo(x+7*s2,y+18*s2);ctx.stroke();
ctx.beginPath();ctx.moveTo(x-7*s2,y+18*s2);ctx.lineTo(x-10*s2,y+20*s2);ctx.stroke();ctx.beginPath();ctx.moveTo(x+7*s2,y+18*s2);ctx.lineTo(x+10*s2,y+20*s2);ctx.stroke();}else if(nm==="pessoaDeitada"){ctx.strokeStyle=cl;ctx.lineWidth=1.8;const s2=hf/20;
ctx.beginPath();ctx.arc(x-16*s2,y,5*s2,0,Math.PI*2);ctx.fillStyle="#f5efe8";ctx.fill();ctx.stroke();
ctx.beginPath();ctx.moveTo(x-11*s2,y);ctx.lineTo(x+4*s2,y);ctx.stroke();
ctx.beginPath();ctx.moveTo(x-8*s2,y);ctx.lineTo(x-2*s2,y-10*s2);ctx.stroke();ctx.beginPath();ctx.moveTo(x-8*s2,y);ctx.lineTo(x-2*s2,y+10*s2);ctx.stroke();
ctx.beginPath();ctx.moveTo(x+4*s2,y);ctx.lineTo(x+18*s2,y-7*s2);ctx.stroke();ctx.beginPath();ctx.moveTo(x+4*s2,y);ctx.lineTo(x+18*s2,y+7*s2);ctx.stroke();
ctx.beginPath();ctx.moveTo(x+18*s2,y-7*s2);ctx.lineTo(x+20*s2,y-10*s2);ctx.stroke();ctx.beginPath();ctx.moveTo(x+18*s2,y+7*s2);ctx.lineTo(x+20*s2,y+10*s2);ctx.stroke();}else if(nm==="veiculo"){ctx.strokeStyle=cl;ctx.fillStyle="#e0e0e0";ctx.lineWidth=1.5;const s2=hf/18;
ctx.beginPath();ctx.moveTo(x-12*s2,y+16*s2);ctx.quadraticCurveTo(x-14*s2,y+10*s2,x-14*s2,y+4*s2);ctx.lineTo(x-14*s2,y-4*s2);ctx.quadraticCurveTo(x-14*s2,y-10*s2,x-12*s2,y-16*s2);ctx.quadraticCurveTo(x,y-20*s2,x+12*s2,y-16*s2);ctx.quadraticCurveTo(x+14*s2,y-10*s2,x+14*s2,y-4*s2);ctx.lineTo(x+14*s2,y+4*s2);ctx.quadraticCurveTo(x+14*s2,y+10*s2,x+12*s2,y+16*s2);ctx.quadraticCurveTo(x,y+20*s2,x-12*s2,y+16*s2);ctx.closePath();ctx.fill();ctx.stroke();
ctx.strokeStyle="#999";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-12*s2,y-8*s2);ctx.lineTo(x+12*s2,y-8*s2);ctx.stroke();ctx.beginPath();ctx.moveTo(x-12*s2,y+8*s2);ctx.lineTo(x+12*s2,y+8*s2);ctx.stroke();
ctx.fillStyle=cl;ctx.fillRect(x-16*s2,y-12*s2,4*s2,8*s2);ctx.fillRect(x+12*s2,y-12*s2,4*s2,8*s2);ctx.fillRect(x-16*s2,y+4*s2,4*s2,8*s2);ctx.fillRect(x+12*s2,y+4*s2,4*s2,8*s2);}else if(nm==="estojo"){ctx.strokeStyle=cl;ctx.fillStyle="#d4a017";ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y-hf*.4,4,2.5,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#c49000";ctx.beginPath();ctx.rect(x-4,y-hf*.4,8,hf*.8);ctx.fill();ctx.strokeRect(x-4,y-hf*.4,8,hf*.8);ctx.fillStyle="#d4a017";ctx.beginPath();ctx.ellipse(x,y+hf*.4,4,2.5,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
else if(nm==="projetil"){ctx.strokeStyle=cl;ctx.fillStyle="#888";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y-hf*.5);ctx.bezierCurveTo(x-4,y-hf*.3,x-4,y+hf*.3,x-3,y+hf*.5);ctx.lineTo(x+3,y+hf*.5);ctx.bezierCurveTo(x+4,y+hf*.3,x+4,y-hf*.3,x,y-hf*.5);ctx.fill();ctx.stroke();ctx.fillStyle="#666";ctx.beginPath();ctx.ellipse(x,y+hf*.5,3,1.5,0,0,Math.PI*2);ctx.fill();}
else if(nm==="faca"){ctx.strokeStyle=cl;ctx.fillStyle=cl;ctx.lineWidth=1.5;const s=hf/12;ctx.beginPath();ctx.moveTo(x-16*s,y);ctx.lineTo(x,y-3*s);ctx.lineTo(x+16*s,y-1*s);ctx.lineTo(x+16*s,y+1*s);ctx.lineTo(x,y+3*s);ctx.closePath();ctx.stroke();ctx.fillStyle="#8B4513";ctx.beginPath();ctx.rect(x-16*s-8*s,y-3*s,8*s,6*s);ctx.fill();ctx.strokeRect(x-16*s-8*s,y-3*s,8*s,6*s);ctx.strokeStyle=cl;ctx.lineWidth=0.5;ctx.moveTo(x-16*s,y-2*s);ctx.lineTo(x-16*s,y+2*s);ctx.stroke();}
else if(nm==="corda"){ctx.strokeStyle=cl;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-hf,y);for(let i=0;i<6;i++)ctx.quadraticCurveTo(x-hf+(hf*2/6)*(i+.5),y+(i%2?-6:6),x-hf+(hf*2/6)*(i+1),y);ctx.stroke();}

else if(nm==="escada"){ctx.strokeStyle=cl;ctx.lineWidth=1.5;ctx.moveTo(x-hf*.3,y-hf);ctx.lineTo(x-hf*.3,y+hf);ctx.stroke();ctx.moveTo(x+hf*.3,y-hf);ctx.lineTo(x+hf*.3,y+hf);ctx.stroke();for(let i=0;i<5;i++){const yy=y-hf+hf*2/5*(i+.5);ctx.moveTo(x-hf*.3,yy);ctx.lineTo(x+hf*.3,yy);ctx.stroke();}}

else if(nm==="regua"){ctx.strokeStyle=cl;ctx.lineWidth=1.5;ctx.fillStyle=cl;ctx.beginPath();ctx.rect(x-hf,y-4,hf*2,8);ctx.stroke();for(let i=0;i<=10;i++){const xx=x-hf+hf*2/10*i;const h2=i%5===0?6:i%2===0?4:2;ctx.moveTo(xx,y+4);ctx.lineTo(xx,y+4-h2);ctx.stroke();}ctx.font="7px sans-serif";ctx.textAlign="center";ctx.fillText("cm",x,y-6);}

else if(nm==="arvore"){ctx.strokeStyle="#5D4037";ctx.fillStyle="#5D4037";ctx.lineWidth=2;ctx.fillRect(x-3,y+hf*.2,6,hf*.8);ctx.fillStyle="#2E7D32";ctx.beginPath();ctx.moveTo(x,y-hf);ctx.lineTo(x-hf*.5,y+hf*.1);ctx.lineTo(x-hf*.3,y+hf*.1);ctx.lineTo(x-hf*.6,y+hf*.35);ctx.lineTo(x-hf*.35,y+hf*.35);ctx.lineTo(x-hf*.5,y+hf*.55);ctx.lineTo(x+hf*.5,y+hf*.55);ctx.lineTo(x+hf*.35,y+hf*.35);ctx.lineTo(x+hf*.6,y+hf*.35);ctx.lineTo(x+hf*.3,y+hf*.1);ctx.lineTo(x+hf*.5,y+hf*.1);ctx.closePath();ctx.fill();}
else if(nm==="poste"){ctx.strokeStyle="#666";ctx.fillStyle="#666";ctx.lineWidth=2.5;ctx.moveTo(x,y+hf);ctx.lineTo(x,y-hf*.6);ctx.stroke();ctx.lineWidth=1.5;ctx.moveTo(x-hf*.4,y-hf*.6);ctx.lineTo(x+hf*.4,y-hf*.6);ctx.stroke();ctx.fillStyle="#FFD700";ctx.beginPath();ctx.moveTo(x-hf*.35,y-hf*.65);ctx.quadraticCurveTo(x-hf*.35,y-hf,x,y-hf);ctx.quadraticCurveTo(x+hf*.35,y-hf,x+hf*.35,y-hf*.65);ctx.closePath();ctx.fill();ctx.strokeStyle="#666";ctx.stroke();}
else if(nm==="camera"){ctx.strokeStyle=cl;ctx.fillStyle=cl;ctx.lineWidth=1.5;ctx.strokeRect(x-hf*.4,y-hf*.25,hf*.8,hf*.5);ctx.beginPath();ctx.moveTo(x+hf*.4,y-hf*.1);ctx.lineTo(x+hf*.6,y-hf*.2);ctx.lineTo(x+hf*.6,y+hf*.2);ctx.lineTo(x+hf*.4,y+hf*.1);ctx.stroke();ctx.beginPath();ctx.arc(x-hf*.15,y-hf*.4,3,0,Math.PI*2);ctx.fill();ctx.moveTo(x-hf*.5,y+hf*.25);ctx.lineTo(x-hf*.5,y+hf*.5);ctx.stroke();ctx.moveTo(x-hf*.5,y+hf*.5);ctx.lineTo(x-hf*.5-4,y+hf*.5+6);ctx.stroke();}
else if(nm==="entradaX"){ctx.strokeStyle="#ff3b30";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-hf*.4,y-hf*.4);ctx.lineTo(x+hf*.4,y+hf*.4);ctx.stroke();ctx.beginPath();ctx.moveTo(x+hf*.4,y-hf*.4);ctx.lineTo(x-hf*.4,y+hf*.4);ctx.stroke();ctx.beginPath();ctx.arc(x,y,hf*.5,0,Math.PI*2);ctx.stroke();}
else if(nm==="entrada"){ctx.strokeStyle="#30d158";ctx.fillStyle="#30d158";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,hf*.4,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y-hf*.6);ctx.lineTo(x,y-hf*.25);ctx.stroke();ctx.beginPath();ctx.moveTo(x-5,y-hf*.4);ctx.lineTo(x,y-hf*.6);ctx.lineTo(x+5,y-hf*.4);ctx.fill();ctx.font="bold 8px sans-serif";ctx.textAlign="center";ctx.fillText("E",x,y+3);}
else if(nm.startsWith("placa_")){const label=nm.replace("placa_","");ctx.fillStyle="#FFD700";ctx.strokeStyle="#333";ctx.lineWidth=1.5;const pw=Math.max(22,label.length*10+12),ph2=20;ctx.beginPath();ctx.moveTo(x-pw/2,y-ph2);ctx.lineTo(x+pw/2,y-ph2);ctx.lineTo(x+pw/2,y);ctx.lineTo(x+2,y);ctx.lineTo(x,y+8);ctx.lineTo(x-2,y);ctx.lineTo(x-pw/2,y);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#000";ctx.font=`bold 14px sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(label,x,y-ph2/2);ctx.textBaseline="alphabetic";}
else if(nm==="moto"){ctx.strokeStyle=cl;ctx.fillStyle="#888";ctx.lineWidth=1.5;const s2=hf/16;
ctx.beginPath();ctx.arc(x-12*s2,y+4*s2,6*s2,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x+12*s2,y+4*s2,6*s2,0,Math.PI*2);ctx.stroke();
ctx.fillStyle=cl;ctx.beginPath();ctx.moveTo(x-6*s2,y+2*s2);ctx.lineTo(x-2*s2,y-10*s2);ctx.lineTo(x+4*s2,y-10*s2);ctx.lineTo(x+8*s2,y);ctx.lineTo(x+6*s2,y+4*s2);ctx.lineTo(x-4*s2,y+4*s2);ctx.closePath();ctx.stroke();
ctx.beginPath();ctx.moveTo(x,y-10*s2);ctx.lineTo(x-2*s2,y-14*s2);ctx.lineTo(x+4*s2,y-14*s2);ctx.lineTo(x+2*s2,y-10*s2);ctx.stroke();}
else if(nm==="bicicleta"){ctx.strokeStyle=cl;ctx.lineWidth=1.5;const s2=hf/16;
ctx.beginPath();ctx.arc(x-10*s2,y+4*s2,6*s2,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x+10*s2,y+4*s2,6*s2,0,Math.PI*2);ctx.stroke();
ctx.beginPath();ctx.moveTo(x-10*s2,y+4*s2);ctx.lineTo(x-2*s2,y-6*s2);ctx.lineTo(x+6*s2,y-6*s2);ctx.stroke();
ctx.beginPath();ctx.moveTo(x-2*s2,y-6*s2);ctx.lineTo(x+4*s2,y+4*s2);ctx.lineTo(x+10*s2,y+4*s2);ctx.stroke();
ctx.beginPath();ctx.moveTo(x+2*s2,y-6*s2);ctx.lineTo(x+4*s2,y-10*s2);ctx.stroke();ctx.beginPath();ctx.moveTo(x-4*s2,y-6*s2);ctx.lineTo(x-6*s2,y-10*s2);ctx.stroke();}
else if(nm==="silhueta"){ctx.strokeStyle=cl;ctx.fillStyle="rgba(255,59,48,0.15)";ctx.lineWidth=2;ctx.setLineDash([4,3]);const s2=hf/18;
ctx.beginPath();ctx.arc(x,y-14*s2,5*s2,0,Math.PI*2);ctx.fill();ctx.stroke();
ctx.beginPath();ctx.moveTo(x-8*s2,y-6*s2);ctx.lineTo(x-12*s2,y+2*s2);ctx.lineTo(x-6*s2,y+2*s2);ctx.lineTo(x-8*s2,y+10*s2);ctx.lineTo(x-12*s2,y+18*s2);ctx.lineTo(x-6*s2,y+18*s2);ctx.lineTo(x-2*s2,y+10*s2);ctx.lineTo(x+2*s2,y+10*s2);ctx.lineTo(x+6*s2,y+18*s2);ctx.lineTo(x+12*s2,y+18*s2);ctx.lineTo(x+8*s2,y+10*s2);ctx.lineTo(x+6*s2,y+2*s2);ctx.lineTo(x+12*s2,y+2*s2);ctx.lineTo(x+8*s2,y-6*s2);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);}
else if(nm==="pegada"){ctx.fillStyle=cl;ctx.strokeStyle=cl;ctx.lineWidth=1;const s=hf/22;
ctx.beginPath();ctx.moveTo(x-5*s,y+18*s);ctx.quadraticCurveTo(x-8*s,y+12*s,x-7*s,y+4*s);ctx.quadraticCurveTo(x-4*s,y-2*s,x-6*s,y-4*s);ctx.quadraticCurveTo(x-8*s,y-6*s,x-5*s,y-8*s);ctx.quadraticCurveTo(x-2*s,y-6*s,x+1*s,y-4*s);ctx.quadraticCurveTo(x+5*s,y-2*s,x+7*s,y+4*s);ctx.quadraticCurveTo(x+8*s,y+12*s,x+5*s,y+18*s);ctx.quadraticCurveTo(x,y+20*s,x-5*s,y+18*s);ctx.closePath();ctx.fill();
ctx.beginPath();ctx.ellipse(x-4*s,y-12*s,3.5*s,4*s,-.2,0,Math.PI*2);ctx.fill();
ctx.beginPath();ctx.ellipse(x-0.5*s,y-14*s,2.8*s,3.5*s,0,0,Math.PI*2);ctx.fill();
ctx.beginPath();ctx.ellipse(x+3*s,y-13*s,2.5*s,3.2*s,.1,0,Math.PI*2);ctx.fill();
ctx.beginPath();ctx.ellipse(x+5.5*s,y-11*s,2.2*s,2.8*s,.2,0,Math.PI*2);ctx.fill();
ctx.beginPath();ctx.ellipse(x+7*s,y-8*s,1.8*s,2.5*s,.4,0,Math.PI*2);ctx.fill();}
else if(nm==="solado"){const s=hf/20;
ctx.fillStyle="rgba(0,0,0,0.15)";ctx.strokeStyle=cl;ctx.lineWidth=1.5;
ctx.beginPath();ctx.moveTo(x-4*s,y-18*s);ctx.quadraticCurveTo(x-8*s,y-16*s,x-7*s,y-10*s);ctx.quadraticCurveTo(x-5*s,y-4*s,x-4*s,y-2*s);ctx.quadraticCurveTo(x-3*s,y+2*s,x-5*s,y+6*s);ctx.quadraticCurveTo(x-7*s,y+10*s,x-7*s,y+14*s);ctx.quadraticCurveTo(x-6*s,y+18*s,x-2*s,y+20*s);ctx.quadraticCurveTo(x+2*s,y+20*s,x+6*s,y+18*s);ctx.quadraticCurveTo(x+7*s,y+14*s,x+7*s,y+10*s);ctx.quadraticCurveTo(x+5*s,y+6*s,x+4*s,y+2*s);ctx.quadraticCurveTo(x+3*s,y-2*s,x+5*s,y-4*s);ctx.quadraticCurveTo(x+7*s,y-10*s,x+7*s,y-14*s);ctx.quadraticCurveTo(x+6*s,y-18*s,x+4*s,y-18*s);ctx.quadraticCurveTo(x,y-20*s,x-4*s,y-18*s);ctx.closePath();ctx.fill();ctx.stroke();
ctx.lineWidth=1;ctx.strokeStyle=cl;
ctx.beginPath();ctx.moveTo(x-6*s,y-12*s);ctx.lineTo(x+6*s,y-12*s);ctx.stroke();
ctx.beginPath();ctx.moveTo(x-5*s,y-8*s);ctx.lineTo(x+5*s,y-8*s);ctx.stroke();
for(let i=0;i<4;i++){const yy=y-12*s+i*3*s;ctx.beginPath();ctx.moveTo(x-6*s+i%2*1.5*s,yy);ctx.lineTo(x+6*s-i%2*1.5*s,yy);ctx.stroke();}
ctx.beginPath();ctx.moveTo(x-4*s,y-2*s);ctx.quadraticCurveTo(x,y-4*s,x+4*s,y-2*s);ctx.stroke();
for(let i=0;i<5;i++){const yy=y+6*s+i*2.5*s;ctx.beginPath();ctx.moveTo(x-6*s+i%2*s,yy);ctx.lineTo(x+6*s-i%2*s,yy);ctx.stroke();}
ctx.lineWidth=0.6;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x-2*s+i*2*s,y-16*s);ctx.lineTo(x-2*s+i*2*s,y-10*s);ctx.stroke();}}
else if(nm==="pneu"){ctx.strokeStyle=cl;ctx.fillStyle="rgba(0,0,0,0.15)";ctx.lineWidth=2;const s2=hf/14;
ctx.beginPath();ctx.moveTo(x-2*s2,y-18*s2);ctx.quadraticCurveTo(x-4*s2,y,x-2*s2,y+18*s2);ctx.lineTo(x+2*s2,y+18*s2);ctx.quadraticCurveTo(x+4*s2,y,x+2*s2,y-18*s2);ctx.closePath();ctx.fill();ctx.stroke();
ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(x,y-18*s2);ctx.lineTo(x,y+18*s2);ctx.stroke();ctx.setLineDash([]);}
else if(nm==="porta"){ctx.strokeStyle=cl;ctx.lineWidth=2;const s2=hf/16;
ctx.beginPath();ctx.moveTo(x-8*s2,y+12*s2);ctx.lineTo(x-8*s2,y-12*s2);ctx.stroke();
ctx.beginPath();ctx.arc(x-8*s2,y+12*s2,20*s2,Math.PI*1.5,0);ctx.stroke();
ctx.fillStyle=cl;ctx.beginPath();ctx.arc(x+6*s2,y-2*s2,2*s2,0,Math.PI*2);ctx.fill();}
else if(nm==="portao"){ctx.strokeStyle=cl;ctx.lineWidth=2;const s2=hf/14;
ctx.strokeRect(x-12*s2,y-10*s2,24*s2,20*s2);
ctx.lineWidth=1;for(let gx=-10;gx<=10;gx+=5){ctx.beginPath();ctx.moveTo(x+gx*s2,y-10*s2);ctx.lineTo(x+gx*s2,y+10*s2);ctx.stroke();}
for(let gy=-8;gy<=8;gy+=8){ctx.beginPath();ctx.moveTo(x-12*s2,y+gy*s2);ctx.lineTo(x+12*s2,y+gy*s2);ctx.stroke();}}
else if(nm==="sofa"){ctx.strokeStyle=cl;ctx.fillStyle="rgba(139,90,43,0.3)";ctx.lineWidth=1.5;const s2=hf/14;
ctx.strokeRect(x-14*s2,y-6*s2,28*s2,14*s2);ctx.fill();
ctx.fillStyle="rgba(139,90,43,0.5)";ctx.fillRect(x-14*s2,y-8*s2,28*s2,4*s2);ctx.strokeRect(x-14*s2,y-8*s2,28*s2,4*s2);
ctx.fillRect(x-14*s2,y-6*s2,4*s2,14*s2);ctx.strokeRect(x-14*s2,y-6*s2,4*s2,14*s2);
ctx.fillRect(x+10*s2,y-6*s2,4*s2,14*s2);ctx.strokeRect(x+10*s2,y-6*s2,4*s2,14*s2);}
else if(nm==="mesa"){ctx.strokeStyle=cl;ctx.fillStyle="rgba(160,120,60,0.2)";ctx.lineWidth=1.5;const s2=hf/14;
ctx.fillRect(x-12*s2,y-8*s2,24*s2,16*s2);ctx.strokeRect(x-12*s2,y-8*s2,24*s2,16*s2);
ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-10*s2,y+8*s2);ctx.lineTo(x-10*s2,y+14*s2);ctx.stroke();
ctx.beginPath();ctx.moveTo(x+10*s2,y+8*s2);ctx.lineTo(x+10*s2,y+14*s2);ctx.stroke();
ctx.beginPath();ctx.moveTo(x-10*s2,y-8*s2);ctx.lineTo(x-10*s2,y-14*s2);ctx.stroke();
ctx.beginPath();ctx.moveTo(x+10*s2,y-8*s2);ctx.lineTo(x+10*s2,y-14*s2);ctx.stroke();}
else if(nm==="cama"){ctx.strokeStyle=cl;ctx.fillStyle="rgba(200,200,220,0.3)";ctx.lineWidth=1.5;const s2=hf/16;
ctx.fillRect(x-10*s2,y-16*s2,20*s2,32*s2);ctx.strokeRect(x-10*s2,y-16*s2,20*s2,32*s2);
ctx.fillStyle="rgba(180,180,200,0.5)";ctx.fillRect(x-8*s2,y-14*s2,16*s2,8*s2);ctx.strokeRect(x-8*s2,y-14*s2,16*s2,8*s2);
ctx.fillStyle=cl;ctx.font=(6*s2)+"px sans-serif";ctx.textAlign="center";ctx.fillText("🛏",x,y+6*s2);}
else if(nm==="pia"){ctx.strokeStyle=cl;ctx.fillStyle="rgba(200,220,240,0.3)";ctx.lineWidth=1.5;const s2=hf/14;
ctx.beginPath();ctx.ellipse(x,y,10*s2,7*s2,0,0,Math.PI*2);ctx.fill();ctx.stroke();
ctx.fillStyle="rgba(100,160,220,0.3)";ctx.beginPath();ctx.ellipse(x,y+1*s2,5*s2,3*s2,0,0,Math.PI*2);ctx.fill();ctx.stroke();
ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-7*s2);ctx.lineTo(x,y-12*s2);ctx.lineTo(x+3*s2,y-12*s2);ctx.stroke();}
else if(nm==="seta"){ctx.strokeStyle=cl;ctx.fillStyle=cl;ctx.lineWidth=2.5;const s2=hf/14;
ctx.beginPath();ctx.moveTo(x-14*s2,y);ctx.lineTo(x+8*s2,y);ctx.stroke();
ctx.beginPath();ctx.moveTo(x+8*s2,y-6*s2);ctx.lineTo(x+14*s2,y);ctx.lineTo(x+8*s2,y+6*s2);ctx.closePath();ctx.fill();}
else if(nm==="pedra"){ctx.strokeStyle=cl;ctx.fillStyle="#aaa";ctx.lineWidth=1.5;
ctx.beginPath();ctx.moveTo(x-hf*.3,y-hf*.4);ctx.lineTo(x+hf*.2,y-hf*.5);ctx.lineTo(x+hf*.5,y-hf*.2);ctx.lineTo(x+hf*.4,y+hf*.3);ctx.lineTo(x-hf*.1,y+hf*.5);ctx.lineTo(x-hf*.5,y+hf*.1);ctx.closePath();ctx.fill();ctx.stroke();}
else if(nm==="lixeira"){ctx.strokeStyle=cl;ctx.fillStyle="#777";ctx.lineWidth=1.5;const s2=hf/14;
ctx.beginPath();ctx.moveTo(x-8*s2,y-6*s2);ctx.lineTo(x-6*s2,y+14*s2);ctx.lineTo(x+6*s2,y+14*s2);ctx.lineTo(x+8*s2,y-6*s2);ctx.closePath();ctx.fill();ctx.stroke();
ctx.fillStyle="#999";ctx.fillRect(x-10*s2,y-8*s2,20*s2,3*s2);ctx.strokeRect(x-10*s2,y-8*s2,20*s2,3*s2);
ctx.fillRect(x-4*s2,y-12*s2,8*s2,4*s2);ctx.strokeRect(x-4*s2,y-12*s2,8*s2,4*s2);}
else if(nm==="incendio"){ctx.fillStyle="#ff6600";ctx.strokeStyle="#cc3300";ctx.lineWidth=1;const s2=hf/14;
ctx.beginPath();ctx.moveTo(x,y-16*s2);ctx.quadraticCurveTo(x+10*s2,y-4*s2,x+8*s2,y+6*s2);ctx.quadraticCurveTo(x+4*s2,y+14*s2,x,y+14*s2);ctx.quadraticCurveTo(x-4*s2,y+14*s2,x-8*s2,y+6*s2);ctx.quadraticCurveTo(x-10*s2,y-4*s2,x,y-16*s2);ctx.closePath();ctx.fill();ctx.stroke();
ctx.fillStyle="#ffcc00";ctx.beginPath();ctx.moveTo(x,y-8*s2);ctx.quadraticCurveTo(x+5*s2,y,x+4*s2,y+6*s2);ctx.quadraticCurveTo(x,y+10*s2,x-4*s2,y+6*s2);ctx.quadraticCurveTo(x-5*s2,y,x,y-8*s2);ctx.closePath();ctx.fill();}
else{ctx.strokeStyle=cl;ctx.fillStyle=cl;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();}ctx.restore();};
const hitStamp=(px,py)=>{const my=(stampObjs||[]).filter(s=>s.sheet===desenhoIdx);const tol=getHitTol();for(let i=my.length-1;i>=0;i--){const s=my[i];const hf=(s.sz||50)/2+tol;if(px>=s.x-hf&&px<=s.x+hf&&py>=s.y-hf&&py<=s.y+hf)return s;}return null;};
  // ──────────────────────────────────────────
  // CANVAS — Handlers de mouse/touch
  // onD: pointerDown, onM: pointerMove, onU: pointerUp
  // ──────────────────────────────────────────
const onD=e=>{e.preventDefault();const ctx=ctxRef.current;if(!ctx)return;const p=cp(e);if(tool==="select"){const hit=hitStamp(p.x,p.y);if(hit){const tol=getHitTol();const hf=(hit.sz||50)/2+tol;const hR=getBtnRadius();/* v246: hR dinâmico — mesmo do renderOverlay */if(Math.hypot(p.x-(hit.x+hf),p.y-(hit.y-hf))<hR){setStampObjs(so=>so.filter(s=>s.id!==hit.id));setSelStamp(null);haptic("medium");sv();return;}if(Math.hypot(p.x-(hit.x-hf),p.y-(hit.y+hf))<hR){setStampObjs(so=>so.map(s=>s.id===hit.id?{...s,rot:((s.rot||0)+45)%360}:s));haptic("light");sv();return;}if(Math.hypot(p.x-(hit.x+hf),p.y-(hit.y+hf))<hR){dragRef.current={id:hit.id,resize:true,startSz:hit.sz||50,startX:p.x,startY:p.y};setSelStamp(hit.id);haptic("selection");return;}setSelStamp(hit.id);haptic("selection");/* v245: feedback ao acertar o stamp */dragRef.current={id:hit.id,ox:p.x-hit.x,oy:p.y-hit.y};}else{setSelStamp(null);}return;}if(stmp){const newSz=getStampSz();/* v245: tamanho dinâmico — sempre ≥44pt no celular */const newObj={id:uid(),sheet:desenhoIdx,type:stmp,x:p.x,y:p.y,rot:stampRot,sz:newSz,color};setStampObjs(so=>[...so,newObj]);if(stmp.startsWith("placa_")){const lbl=stmp.replace("placa_","");if(!canvasVest.find(v=>v.placa===lbl))setCanvasVest(cv=>[...cv,{id:uid(),placa:lbl,desc:"",suporte:"",coord1:"",coord2:"",altura:"",recolhido:"",destino:""}]);}haptic("selection");setTimeout(()=>sv(),50);return;}if(tool==="text"){setTextPos({x:p.x,y:p.y});setShowTextInput(true);return;}
drawRef.current=true;
const snapDist=12;if(showGrid&&(tool==="line"||tool==="rect")){p.x=Math.round(p.x/20)*20;p.y=Math.round(p.y/20)*20;}if(tool==="line"||tool==="rect"){const near=lineEndsRef.current.find(pt=>Math.abs(pt.x-p.x)<snapDist&&Math.abs(pt.y-p.y)<snapDist);if(near){p.x=near.x;p.y=near.y;}}
startRef.current=p;snapRef.current=ctx.getImageData(0,0,1200,850);pH2();if(tool==="pen"||tool==="eraser"){ctx.beginPath();ctx.moveTo(p.x,p.y);}if(tool==="eraser"){const eraserR=sz*2;const hitIds=(stampObjs||[]).filter(s2=>s2.sheet===desenhoIdx).filter(s2=>{const sh=(s2.sz||50)/2;const dx=p.x-s2.x,dy=p.y-s2.y;return Math.sqrt(dx*dx+dy*dy)<eraserR+sh;}).map(s2=>s2.id);if(hitIds.length){setStampObjs(prev=>prev.filter(s2=>!hitIds.includes(s2.id)));}}};
const onM=e=>{if(tool==="eraser"&&overlayRef.current){e.preventDefault();const p=cp(e);const oc=overlayRef.current.getContext("2d");oc.clearRect(0,0,1200,850);/* re-render stamps */const myEs=(stampObjs||[]).filter(s2=>s2.sheet===desenhoIdx);myEs.forEach(s2=>{oc.save();oc.translate(s2.x,s2.y);oc.rotate((s2.rot||0)*Math.PI/180);ds(oc,s2.type,0,0,s2.color||"#000",s2.sz||50);oc.restore();});/* círculo da borracha */const eraserR=sz*2;oc.save();oc.strokeStyle="#ff3b30";oc.fillStyle="rgba(255,59,48,0.15)";oc.lineWidth=2;oc.setLineDash([4,4]);oc.beginPath();oc.arc(p.x,p.y,eraserR,0,Math.PI*2);oc.fill();oc.stroke();oc.setLineDash([]);oc.restore();/* fall through pra borracha real */}if(tool==="select"&&dragRef.current){e.preventDefault();const p=cp(e);const tol=getHitTol();if(dragRef.current.resize){const delta=Math.round((p.x-dragRef.current.startX)+(p.y-dragRef.current.startY));const newSz=Math.max(20,Math.min(200,dragRef.current.startSz+delta));dragRef.current.newSz=newSz;const oc=overlayRef.current;if(oc){const ctx2=oc.getContext("2d");ctx2.clearRect(0,0,1200,850);(stampObjs||[]).filter(s2=>s2.sheet===desenhoIdx).forEach(s2=>{const sz2=s2.id===dragRef.current.id?newSz:(s2.sz||50);ctx2.save();ctx2.translate(s2.x,s2.y);ctx2.rotate((s2.rot||0)*Math.PI/180);ds(ctx2,s2.type,0,0,s2.color||"#000",sz2);ctx2.restore();if(s2.id===dragRef.current.id){ctx2.strokeStyle="#34c759";ctx2.lineWidth=3;ctx2.setLineDash([5,4]);const hf2=sz2/2+tol;ctx2.strokeRect(s2.x-hf2,s2.y-hf2,hf2*2,hf2*2);ctx2.setLineDash([]);ctx2.fillStyle="#34c759";ctx2.font="bold 14px sans-serif";ctx2.textAlign="center";ctx2.fillText(sz2+"px",s2.x,s2.y-sz2/2-16);}});}return;}dragRef.current.cx=p.x-dragRef.current.ox;dragRef.current.cy=p.y-dragRef.current.oy;const oc=overlayRef.current;if(oc){const ctx2=oc.getContext("2d");ctx2.clearRect(0,0,1200,850);const myS=(stampObjs||[]).filter(s2=>s2.sheet===desenhoIdx);myS.forEach(s2=>{const dx=s2.id===dragRef.current.id?dragRef.current.cx:s2.x;const dy=s2.id===dragRef.current.id?dragRef.current.cy:s2.y;ctx2.save();ctx2.translate(dx,dy);ctx2.rotate((s2.rot||0)*Math.PI/180);ds(ctx2,s2.type,0,0,s2.color||"#000",s2.sz||50);ctx2.restore();if(s2.id===dragRef.current.id){ctx2.strokeStyle="#007aff";ctx2.lineWidth=3;ctx2.setLineDash([5,4]);const hf2=(s2.sz||50)/2+tol;ctx2.strokeRect(dx-hf2,dy-hf2,hf2*2,hf2*2);ctx2.setLineDash([]);}});}return;}if(stmp&&overlayRef.current){e.preventDefault();const p=cp(e);const oc=overlayRef.current.getContext("2d");oc.clearRect(0,0,1200,850);const myS2=(stampObjs||[]).filter(s2=>s2.sheet===desenhoIdx);myS2.forEach(s2=>{oc.save();oc.translate(s2.x,s2.y);oc.rotate((s2.rot||0)*Math.PI/180);ds(oc,s2.type,0,0,s2.color||"#000",s2.sz||50);oc.restore();});oc.save();oc.globalAlpha=0.35;oc.translate(p.x,p.y);oc.rotate(stampRot*Math.PI/180);ds(oc,stmp,0,0,color,getStampSz());oc.restore();oc.save();oc.strokeStyle="#007aff";oc.lineWidth=1;oc.setLineDash([3,3]);oc.beginPath();oc.moveTo(p.x-12,p.y);oc.lineTo(p.x+12,p.y);oc.moveTo(p.x,p.y-12);oc.lineTo(p.x,p.y+12);oc.stroke();oc.setLineDash([]);oc.restore();return;}if(!drawRef.current||!ctxRef.current)return;e.preventDefault();const ctx=ctxRef.current;const p=cp(e);if(tool==="pen"){ctx.strokeStyle=color;/* Pressure sensitivity: Apple Pencil/stylus modula espessura entre 30%-170% */const isPen=e.pointerType==="pen";const pr=(isPen&&typeof e.pressure==="number"&&e.pressure>0)?e.pressure:0.5;ctx.lineWidth=isPen?Math.max(0.5,sz*(0.3+pr*1.4)):sz;ctx.lineCap="round";if(pStyle==="dashed")ctx.setLineDash([sz*2,sz*2]);else if(pStyle==="dotted")ctx.setLineDash([sz,sz*3]);else ctx.setLineDash([]);ctx.lineTo(p.x,p.y);ctx.stroke();}else if(tool==="eraser"){ctx.save();ctx.globalCompositeOperation="destination-out";ctx.strokeStyle="rgba(0,0,0,1)";ctx.lineWidth=sz*4;ctx.lineCap="round";ctx.setLineDash([]);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.restore();if(templateRef.current){if(!eraserCanvasRef.current){eraserCanvasRef.current=document.createElement("canvas");eraserCanvasRef.current.width=1200;eraserCanvasRef.current.height=850;}const tmpCtx=eraserCanvasRef.current.getContext("2d");tmpCtx.putImageData(templateRef.current,0,0);ctx.save();ctx.globalCompositeOperation="destination-over";ctx.drawImage(eraserCanvasRef.current,0,0);ctx.restore();}/* Apagar stamps tocados pela borracha */const eraserR=sz*2;const hitIds=(stampObjs||[]).filter(s2=>s2.sheet===desenhoIdx).filter(s2=>{const sh=(s2.sz||50)/2;const dx=p.x-s2.x,dy=p.y-s2.y;return Math.sqrt(dx*dx+dy*dy)<eraserR+sh;}).map(s2=>s2.id);if(hitIds.length){setStampObjs(prev=>prev.filter(s2=>!hitIds.includes(s2.id)));}}else if(tool==="line"||tool==="rect"||tool==="circle"||tool==="measure"){ctx.putImageData(snapRef.current,0,0);ctx.strokeStyle=color;ctx.lineWidth=sz;ctx.setLineDash([]);ctx.beginPath();const sp=startRef.current;if(tool==="line"){let ex=p.x,ey=p.y;if(shiftHeld){const dx=p.x-sp.x,dy=p.y-sp.y;const ang=Math.atan2(dy,dx);const snA=Math.round(ang/(Math.PI/4))*(Math.PI/4);const dist=Math.sqrt(dx*dx+dy*dy);ex=sp.x+Math.cos(snA)*dist;ey=sp.y+Math.sin(snA)*dist;}else if(lMode==="h")ey=sp.y;else if(lMode==="v")ex=sp.x;if(showGrid){ex=Math.round(ex/20)*20;ey=Math.round(ey/20)*20;}const sn=12;const nearEnd=lineEndsRef.current.find(pt=>Math.abs(pt.x-ex)<sn&&Math.abs(pt.y-ey)<sn);if(nearEnd){ex=nearEnd.x;ey=nearEnd.y;}ctx.moveTo(sp.x,sp.y);ctx.lineTo(ex,ey);}else if(tool==="measure"){ctx.strokeStyle="#ff3b30";ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.moveTo(sp.x,sp.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.setLineDash([]);const dx=p.x-sp.x,dy=p.y-sp.y;const dist=Math.sqrt(dx*dx+dy*dy);const meters=(dist/ppm).toFixed(2);const mx=(sp.x+p.x)/2,my=(sp.y+p.y)/2;ctx.fillStyle="#ff3b30";ctx.font="bold 16px sans-serif";ctx.textAlign="center";ctx.fillText(meters+"m",mx,my-10);ctx.beginPath();ctx.arc(sp.x,sp.y,4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();}else if(tool==="rect")ctx.rect(sp.x,sp.y,p.x-sp.x,p.y-sp.y);else{const rx=Math.abs(p.x-sp.x)/2,ry=Math.abs(p.y-sp.y)/2;if(rx>0&&ry>0)ctx.ellipse(sp.x+(p.x-sp.x)/2,sp.y+(p.y-sp.y)/2,rx,ry,0,0,Math.PI*2);}ctx.stroke();}};
const onU=(e)=>{if(tool==="eraser"&&overlayRef.current){const oc=overlayRef.current.getContext("2d");oc.clearRect(0,0,1200,850);(stampObjs||[]).filter(s2=>s2.sheet===desenhoIdx).forEach(s2=>{oc.save();oc.translate(s2.x,s2.y);oc.rotate((s2.rot||0)*Math.PI/180);ds(oc,s2.type,0,0,s2.color||"#000",s2.sz||50);oc.restore();});}if(dragRef.current){const did=dragRef.current.id;if(dragRef.current.resize){const ns=dragRef.current.newSz;if(ns){setStampObjs(so=>so.map(s=>s.id===did?{...s,sz:ns}:s));}dragRef.current=null;setTimeout(()=>sv(),60);return;}const fx=dragRef.current.cx;const fy=dragRef.current.cy;if(fx!==undefined){setStampObjs(so=>so.map(s=>s.id===did?{...s,x:fx,y:fy}:s));}dragRef.current=null;setTimeout(()=>sv(),60);return;}if(!drawRef.current)return;drawRef.current=false;ctxRef.current?.setLineDash([]);if((tool==="line"||tool==="rect")&&startRef.current){const p=e?cp(e):startRef.current;let ex=p.x,ey=p.y;if(tool==="line"){if(lMode==="h")ey=startRef.current.y;if(lMode==="v")ex=startRef.current.x;}lineEndsRef.current=[...lineEndsRef.current.slice(-40),{x:startRef.current.x,y:startRef.current.y},{x:ex,y:ey}];}sv();};
  // ──────────────────────────────────────────
  // CANVAS — Undo/Redo
  // ──────────────────────────────────────────
const undo=()=>{if(histRef.current.length&&canvasRef.current){redoRef.current.push(canvasRef.current.toDataURL("image/jpeg",0.7));const l=histRef.current.pop();const im=new Image();im.onload=()=>{ctxRef.current?.drawImage(im,0,0);sv();};im.src=l;}};
const redo=()=>{if(redoRef.current.length&&canvasRef.current){histRef.current.push(canvasRef.current.toDataURL("image/jpeg",0.7));const l=redoRef.current.pop();const im=new Image();im.onload=()=>{ctxRef.current?.drawImage(im,0,0);sv();};im.src=l;}};
const clr=()=>{if(!ctxRef.current)return;pH2();ctxRef.current.fillStyle="#fff";ctxRef.current.fillRect(0,0,1200,850);templateRef.current=null;delete templatesRef.current[desenhoIdx];
// Save blank canvas synchronously, then clear stamps
const tmp2=document.createElement("canvas");tmp2.width=1200;tmp2.height=850;const tc2=tmp2.getContext("2d");tc2.fillStyle="#fff";tc2.fillRect(0,0,1200,850);imgRef.current[desenhoIdx]=tmp2.toDataURL();
setStampObjs(so=>so.filter(s=>s.sheet!==desenhoIdx));setSelStamp(null);};
const applyText=()=>{if(!textVal||!ctxRef.current)return;pH2();const ctx=ctxRef.current;ctx.font=`bold ${Math.max(sz*4,16)}px sans-serif`;ctx.fillStyle=color;ctx.fillText(textVal,textPos.x,textPos.y);sv();setShowTextInput(false);setTextVal("");};

const drawGrid=(ctx)=>{ctx.save();ctx.strokeStyle="#c0c0c0";ctx.lineWidth=0.3;for(let x=0;x<1200;x+=20){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,850);ctx.stroke();}for(let y=0;y<850;y+=20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1200,y);ctx.stroke();}ctx.restore();};
const toggleGrid=()=>{const next=!showGrid;setShowGrid(next);if(ctxRef.current&&canvasRef.current){if(next){drawGrid(ctxRef.current);}else{const img=new Image();const src=imgRef.current[desenhoIdx];if(src){img.onload=()=>{ctxRef.current.drawImage(img,0,0);if(templateRef.current){/* template already baked in */}};img.src=src;}else{ctxRef.current.fillStyle="#fff";ctxRef.current.fillRect(0,0,1200,850);if(templateRef.current)ctxRef.current.putImageData(templateRef.current,0,0);}}}};

const north=()=>{if(!ctxRef.current)return;pH2();const ctx=ctxRef.current;ctx.save();ctx.strokeStyle="#333";ctx.fillStyle="#333";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(1150,75);ctx.lineTo(1150,25);ctx.stroke();ctx.beginPath();ctx.moveTo(1142,35);ctx.lineTo(1150,25);ctx.lineTo(1158,35);ctx.fill();ctx.font="bold 14px sans-serif";ctx.textAlign="center";ctx.fillText("N",1150,20);ctx.restore();sv();};
const templateCasa=()=>{if(!ctxRef.current)return;pH2();const ctx=ctxRef.current;ctx.save();ctx.strokeStyle="#333";ctx.fillStyle="#333";ctx.lineWidth=2.5;ctx.setLineDash([]);/* Casa retangular ~ 600x400 centralizada */const x0=300,y0=225,w=600,h=400;ctx.strokeRect(x0,y0,w,h);/* Divisória interna vertical (cômodo D maior) */ctx.beginPath();ctx.moveTo(x0+360,y0);ctx.lineTo(x0+360,y0+250);ctx.stroke();/* Divisória interna horizontal (cômodos do fundo) */ctx.beginPath();ctx.moveTo(x0+360,y0+250);ctx.lineTo(x0+w,y0+250);ctx.stroke();/* Porta principal (frente, abertura) */ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x0+w/2-30,y0+h);ctx.lineTo(x0+w/2-30,y0+h-3);ctx.moveTo(x0+w/2+30,y0+h);ctx.lineTo(x0+w/2+30,y0+h-3);ctx.stroke();ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(x0+w/2-30,y0+h-3,60,0,-Math.PI/2,true);ctx.stroke();ctx.setLineDash([]);/* Janelas (3 — frente, lateral D, fundo) */ctx.lineWidth=2;ctx.beginPath();/* janela frente esquerda */ctx.moveTo(x0+80,y0+h);ctx.lineTo(x0+160,y0+h);/* janela lateral D */ctx.moveTo(x0+w,y0+80);ctx.lineTo(x0+w,y0+160);/* janela fundo */ctx.moveTo(x0+w-160,y0);ctx.lineTo(x0+w-80,y0);ctx.stroke();/* preenchimento branco para esconder borda */ctx.fillStyle="#fff";ctx.fillRect(x0+82,y0+h-1,76,2);ctx.fillRect(x0+w-1,y0+82,2,76);ctx.fillRect(x0+w-158,y0-1,76,2);/* hachuras da janela */ctx.fillStyle="#333";ctx.font="9px sans-serif";ctx.textAlign="center";ctx.fillText("J",x0+120,y0+h+11);ctx.fillText("J",x0+w+11,y0+120);ctx.fillText("J",x0+w-120,y0-3);ctx.fillText("P",x0+w/2,y0+h+11);/* Labels dos cômodos */ctx.font="bold 12px sans-serif";ctx.fillStyle="#666";ctx.fillText("Sala",x0+180,y0+125);ctx.fillText("Quarto",x0+480,y0+125);ctx.fillText("Cozinha",x0+180,y0+325);ctx.fillText("Banh.",x0+440,y0+325);ctx.fillText("Quarto 2",x0+520,y0+325);ctx.restore();sv();showToast("🏠 Template casa inserido — ajuste e adicione vestígios");};
const templateRua=()=>{if(!ctxRef.current)return;pH2();const ctx=ctxRef.current;ctx.save();ctx.strokeStyle="#333";ctx.fillStyle="#333";ctx.lineWidth=2;ctx.setLineDash([]);/* Via central horizontal — 2 pistas */const cy=425;const wRua=180;/* limites externos da via (meios-fios) */ctx.beginPath();ctx.moveTo(50,cy-wRua/2);ctx.lineTo(1150,cy-wRua/2);ctx.moveTo(50,cy+wRua/2);ctx.lineTo(1150,cy+wRua/2);ctx.stroke();/* Faixa central tracejada */ctx.lineWidth=2;ctx.setLineDash([20,15]);ctx.beginPath();ctx.moveTo(50,cy);ctx.lineTo(1150,cy);ctx.stroke();ctx.setLineDash([]);/* Calçadas (linhas internas) */ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(50,cy-wRua/2-30);ctx.lineTo(1150,cy-wRua/2-30);ctx.moveTo(50,cy+wRua/2+30);ctx.lineTo(1150,cy+wRua/2+30);ctx.stroke();/* Hachura nas calçadas */ctx.lineWidth=0.5;ctx.strokeStyle="#999";for(let xH=60;xH<1150;xH+=18){ctx.beginPath();ctx.moveTo(xH,cy-wRua/2-30);ctx.lineTo(xH+8,cy-wRua/2);ctx.moveTo(xH,cy+wRua/2);ctx.lineTo(xH+8,cy+wRua/2+30);ctx.stroke();}/* Labels */ctx.fillStyle="#666";ctx.font="bold 11px sans-serif";ctx.textAlign="left";ctx.fillText("Calçada N",60,cy-wRua/2-38);ctx.fillText("Calçada S",60,cy+wRua/2+45);ctx.font="italic 10px sans-serif";ctx.fillText("Pista 1 (sentido →)",60,cy-12);ctx.fillText("Pista 2 (sentido ←)",60,cy+22);ctx.restore();sv();showToast("🛣️ Template via pública inserido");};
  // ──────────────────────────────────────────
  // CANVAS — Templates de cena (sala, cozinha, etc)
  // ──────────────────────────────────────────
const drawTemplate=(tpl)=>{const c=canvasRef.current;const ctx=ctxRef.current;if(!c||!ctx)return;pH2();
// Delete old image BEFORE state updates to prevent useEffect race condition
delete imgRef.current[desenhoIdx];delete templatesRef.current[desenhoIdx];templateRef.current=null;ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,850);ctx.save();
if(tpl==="pista_simples"){
ctx.fillStyle="#888";ctx.fillRect(0,240,1200,120);
ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.setLineDash([20,15]);ctx.beginPath();ctx.moveTo(0,300);ctx.lineTo(1200,300);ctx.stroke();ctx.setLineDash([]);
ctx.fillStyle="#ccc";ctx.fillRect(0,220,1200,20);ctx.fillRect(0,360,1200,20);
ctx.strokeStyle="#999";ctx.lineWidth=1;ctx.strokeRect(0,220,1200,20);ctx.strokeRect(0,360,1200,20);
ctx.fillStyle="#e8e8e8";ctx.fillRect(0,0,1200,220);ctx.fillRect(0,380,1200,220);
ctx.strokeStyle="#bbb";ctx.lineWidth=0.5;
for(let x=0;x<1200;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,220);ctx.stroke();ctx.beginPath();ctx.moveTo(x,380);ctx.lineTo(x,850);ctx.stroke();}
ctx.fillStyle="#999";ctx.font="11px sans-serif";ctx.textAlign="center";ctx.fillText("LOTES",428,110);ctx.fillText("LOTES",428,490);ctx.fillText("CALÇADA",428,232);ctx.fillText("CALÇADA",428,374);
ctx.fillText("← PISTA →",428,296);
}
else if(tpl==="pista_dupla"){
ctx.fillStyle="#888";ctx.fillRect(0,220,1200,70);ctx.fillRect(0,310,1200,70);
ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.setLineDash([20,15]);ctx.beginPath();ctx.moveTo(0,255);ctx.lineTo(1200,255);ctx.stroke();ctx.beginPath();ctx.moveTo(0,345);ctx.lineTo(1200,345);ctx.stroke();ctx.setLineDash([]);
ctx.fillStyle="#666";ctx.fillRect(0,290,1200,20);
ctx.strokeStyle="#ff0";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,298);ctx.lineTo(1200,298);ctx.stroke();ctx.beginPath();ctx.moveTo(0,302);ctx.lineTo(1200,302);ctx.stroke();
ctx.fillStyle="#ccc";ctx.fillRect(0,200,1200,20);ctx.fillRect(0,380,1200,20);
ctx.fillStyle="#e8e8e8";ctx.fillRect(0,0,1200,200);ctx.fillRect(0,400,1200,200);
ctx.strokeStyle="#bbb";ctx.lineWidth=0.5;
for(let x=0;x<1200;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,200);ctx.stroke();ctx.beginPath();ctx.moveTo(x,400);ctx.lineTo(x,850);ctx.stroke();}
ctx.fillStyle="#999";ctx.font="11px sans-serif";ctx.textAlign="center";ctx.fillText("LOTES",428,100);ctx.fillText("LOTES",428,500);ctx.fillText("CALÇADA",428,212);ctx.fillText("CALÇADA",428,394);
ctx.fillText("← PISTA",428,260);ctx.fillText("PISTA →",428,350);
}
else if(tpl==="avenida_canteiro"){
ctx.fillStyle="#888";ctx.fillRect(0,190,1200,80);ctx.fillRect(0,330,1200,80);
ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.setLineDash([20,15]);ctx.beginPath();ctx.moveTo(0,230);ctx.lineTo(1200,230);ctx.stroke();ctx.beginPath();ctx.moveTo(0,370);ctx.lineTo(1200,370);ctx.stroke();ctx.setLineDash([]);
ctx.fillStyle="#4a7c3f";ctx.fillRect(0,270,1200,60);
ctx.strokeStyle="#3a6030";ctx.lineWidth=1;ctx.strokeRect(0,270,1200,60);
for(let x=50;x<1200;x+=120){ctx.fillStyle="#2d5a1e";ctx.beginPath();ctx.arc(x,300,14,0,Math.PI*2);ctx.fill();ctx.fillStyle="#5D4037";ctx.fillRect(x-2,300,4,15);}
ctx.fillStyle="#fff";ctx.font="10px sans-serif";ctx.textAlign="center";ctx.fillText("CANTEIRO CENTRAL",428,304);
ctx.fillStyle="#ccc";ctx.fillRect(0,170,1200,20);ctx.fillRect(0,410,1200,20);
ctx.fillStyle="#e8e8e8";ctx.fillRect(0,0,1200,170);ctx.fillRect(0,430,1200,170);
ctx.strokeStyle="#bbb";ctx.lineWidth=0.5;
for(let x=0;x<1200;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,170);ctx.stroke();ctx.beginPath();ctx.moveTo(x,430);ctx.lineTo(x,850);ctx.stroke();}
ctx.fillStyle="#999";ctx.font="11px sans-serif";ctx.fillText("LOTES",428,85);ctx.fillText("LOTES",428,515);ctx.fillText("CALÇADA",428,182);ctx.fillText("CALÇADA",428,424);
ctx.fillText("← PISTA",428,236);ctx.fillText("PISTA →",428,376);
}
else if(tpl==="cruzamento"){
ctx.fillStyle="#f0f0f0";ctx.fillRect(0,0,1200,800);
const rw=90,sw=14,lc="#aaa",rc="#808080",wc="#fff",sc="#c8c8c8";
// Horizontal road
ctx.fillStyle=rc;ctx.fillRect(0,255,1200,rw);
ctx.fillStyle=sc;ctx.fillRect(0,241,1200,sw);ctx.fillRect(0,255+rw,1200,sw);
// Vertical road
ctx.fillStyle=rc;ctx.fillRect(383,0,rw,850);
ctx.fillStyle=sc;ctx.fillRect(369,0,sw,850);ctx.fillRect(383+rw,0,sw,850);
// Center lines
ctx.strokeStyle=wc;ctx.lineWidth=2;ctx.setLineDash([16,12]);
ctx.beginPath();ctx.moveTo(0,300);ctx.lineTo(369,300);ctx.stroke();
ctx.beginPath();ctx.moveTo(383+rw+sw,300);ctx.lineTo(1200,300);ctx.stroke();
ctx.beginPath();ctx.moveTo(428,0);ctx.lineTo(428,241);ctx.stroke();
ctx.beginPath();ctx.moveTo(428,255+rw+sw);ctx.lineTo(428,850);ctx.stroke();
ctx.setLineDash([]);
// Crosswalks
ctx.fillStyle="rgba(255,255,255,0.5)";
for(let i=0;i<4;i++){ctx.fillRect(387+i*20,241-30,12,26);ctx.fillRect(387+i*20,255+rw+4,12,26);}
for(let i=0;i<4;i++){ctx.fillRect(369-30,259+i*20,26,12);ctx.fillRect(383+rw+4,259+i*20,26,12);}
// Lot blocks
ctx.fillStyle="#e4e4e4";ctx.strokeStyle="#ccc";ctx.lineWidth=0.5;
ctx.fillRect(0,0,369,241);ctx.strokeRect(0,0,369,241);
ctx.fillRect(383+rw+sw,0,1200-(383+rw+sw),241);ctx.strokeRect(383+rw+sw,0,1200-(383+rw+sw),241);
ctx.fillRect(0,255+rw+sw,369,850-(255+rw+sw));ctx.strokeRect(0,255+rw+sw,369,850-(255+rw+sw));
ctx.fillRect(383+rw+sw,255+rw+sw,1200-(383+rw+sw),850-(255+rw+sw));ctx.strokeRect(383+rw+sw,255+rw+sw,1200-(383+rw+sw),850-(255+rw+sw));
// Lot dividers
ctx.strokeStyle="#ccc";for(let x=80;x<369;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,241);ctx.stroke();ctx.beginPath();ctx.moveTo(x,255+rw+sw);ctx.lineTo(x,850);ctx.stroke();}
for(let x=383+rw+sw+80;x<1200;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,241);ctx.stroke();ctx.beginPath();ctx.moveTo(x,255+rw+sw);ctx.lineTo(x,850);ctx.stroke();}
// Labels
ctx.fillStyle="#aaa";ctx.font="10px sans-serif";ctx.textAlign="center";
ctx.fillText("LOTE",180,120);ctx.fillText("LOTE",640,120);ctx.fillText("LOTE",180,480);ctx.fillText("LOTE",640,480);
ctx.fillStyle="rgba(255,255,255,0.7)";ctx.font="bold 9px sans-serif";
ctx.fillText("VIA PRINCIPAL →",200,296);ctx.fillText("← VIA PRINCIPAL",660,304);
ctx.save();ctx.translate(424,120);ctx.rotate(-Math.PI/2);ctx.fillText("VIA TRANSVERSAL",0,0);ctx.restore();
}
else if(tpl==="pista_simples_transv"){
ctx.fillStyle="#f0f0f0";ctx.fillRect(0,0,1200,800);
const rw=90,sw=14,rc="#808080",sc="#c8c8c8";
// Horizontal main road
ctx.fillStyle=rc;ctx.fillRect(0,255,1200,rw);
ctx.fillStyle=sc;ctx.fillRect(0,241,1200,sw);ctx.fillRect(0,255+rw,1200,sw);
// Vertical transversal - only bottom half (T-intersection)
ctx.fillStyle=rc;ctx.fillRect(383,255+rw+sw,rw,850-(255+rw+sw));
ctx.fillStyle=sc;ctx.fillRect(369,255+rw+sw,sw,850-(255+rw+sw));ctx.fillRect(383+rw,255+rw+sw,sw,850-(255+rw+sw));
// Center lines
ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.setLineDash([16,12]);
ctx.beginPath();ctx.moveTo(0,300);ctx.lineTo(1200,300);ctx.stroke();
ctx.beginPath();ctx.moveTo(428,255+rw+sw);ctx.lineTo(428,850);ctx.stroke();
ctx.setLineDash([]);
// Lots
ctx.fillStyle="#e4e4e4";ctx.strokeStyle="#ccc";ctx.lineWidth=0.5;
ctx.fillRect(0,0,1200,241);ctx.strokeRect(0,0,1200,241);
ctx.fillRect(0,255+rw+sw,369,850-(255+rw+sw));ctx.strokeRect(0,255+rw+sw,369,850-(255+rw+sw));
ctx.fillRect(383+rw+sw,255+rw+sw,1200-(383+rw+sw),850-(255+rw+sw));ctx.strokeRect(383+rw+sw,255+rw+sw,1200-(383+rw+sw),850-(255+rw+sw));
ctx.strokeStyle="#ccc";for(let x=80;x<1200;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,241);ctx.stroke();}
for(let x=80;x<369;x+=80){ctx.beginPath();ctx.moveTo(x,255+rw+sw);ctx.lineTo(x,850);ctx.stroke();}
for(let x=383+rw+sw+80;x<1200;x+=80){ctx.beginPath();ctx.moveTo(x,255+rw+sw);ctx.lineTo(x,850);ctx.stroke();}
ctx.fillStyle="#aaa";ctx.font="10px sans-serif";ctx.textAlign="center";
ctx.fillText("LOTES",428,120);ctx.fillText("LOTE",180,480);ctx.fillText("LOTE",640,480);
ctx.fillStyle="rgba(255,255,255,0.7)";ctx.font="bold 9px sans-serif";
ctx.fillText("← VIA PRINCIPAL →",428,296);
ctx.save();ctx.translate(424,480);ctx.rotate(-Math.PI/2);ctx.fillText("VIA TRANSV.",0,0);ctx.restore();
}

else if(tpl==="rotatoria"){
ctx.fillStyle="#f0f0f0";ctx.fillRect(0,0,1200,850);
ctx.fillStyle="#808080";ctx.beginPath();ctx.arc(600,400,200,0,Math.PI*2);ctx.fill();
ctx.fillStyle="#4a7c3f";ctx.beginPath();ctx.arc(600,400,100,0,Math.PI*2);ctx.fill();
ctx.fillStyle="#808080";ctx.fillRect(500,0,200,200);ctx.fillRect(500,600,200,200);ctx.fillRect(0,300,200,200);ctx.fillRect(1000,300,200,200);
ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.setLineDash([12,10]);ctx.beginPath();ctx.arc(600,400,200,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
ctx.fillStyle="#aaa";ctx.font="10px sans-serif";ctx.textAlign="center";ctx.fillText("ROTATÓRIA",600,405);
}
else if(tpl==="estacionamento"){
ctx.fillStyle="#aaa";ctx.fillRect(0,0,1200,850);
ctx.fillStyle="#808080";ctx.fillRect(0,380,1200,90);
ctx.strokeStyle="#fff";ctx.lineWidth=2;for(let x=100;x<1200;x+=120){ctx.strokeRect(x,60,100,280);ctx.strokeRect(x,510,100,280);}
ctx.fillStyle="#fff";ctx.font="10px sans-serif";ctx.textAlign="center";ctx.fillText("CORREDOR",600,430);
}
else if(tpl==="estrada_rural"){
ctx.fillStyle="#c8b070";ctx.fillRect(0,0,1200,850);ctx.fillStyle="#a08040";ctx.fillRect(0,320,1200,200);
ctx.strokeStyle="#8a6030";ctx.setLineDash([20,15]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,420);ctx.lineTo(1200,420);ctx.stroke();ctx.setLineDash([]);
ctx.fillStyle="#4a7c3f";for(let x=80;x<1200;x+=200){ctx.beginPath();ctx.arc(x,150,30,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x,700,25,0,Math.PI*2);ctx.fill();}
ctx.fillStyle="rgba(255,255,255,0.5)";ctx.font="10px sans-serif";ctx.textAlign="center";ctx.fillText("ESTRADA RURAL",600,416);
}
else if(tpl==="quarto"){
ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,850);ctx.strokeStyle="#333";ctx.lineWidth=3;ctx.strokeRect(200,100,800,650);
ctx.fillStyle="#ddd";ctx.fillRect(440,100,120,8);ctx.fillStyle="#333";ctx.font="10px sans-serif";ctx.textAlign="center";ctx.fillText("JANELA",500,95);
ctx.fillRect(200,400,8,100);ctx.save();ctx.beginPath();ctx.arc(208,400,60,Math.PI*0.5,Math.PI);ctx.strokeStyle="#999";ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);ctx.restore();ctx.fillText("PORTA",190,460);
ctx.strokeStyle="#bbb";ctx.lineWidth=1;ctx.strokeRect(650,108,300,200);ctx.fillText("CAMA",800,210);
ctx.fillStyle="#aaa";ctx.font="11px sans-serif";ctx.fillText("QUARTO",600,440);
}
else if(tpl==="sala"){
ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,850);ctx.strokeStyle="#333";ctx.lineWidth=3;ctx.strokeRect(150,80,900,680);
ctx.fillStyle="#ddd";ctx.fillRect(400,80,200,8);ctx.fillRect(700,80,150,8);
ctx.fillStyle="#333";ctx.font="10px sans-serif";ctx.textAlign="center";ctx.fillText("JANELA",500,75);ctx.fillText("JANELA",775,75);
ctx.fillRect(150,350,8,120);ctx.save();ctx.beginPath();ctx.arc(158,350,70,Math.PI*0.5,Math.PI);ctx.strokeStyle="#999";ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);ctx.restore();ctx.fillText("PORTA",140,420);
ctx.strokeStyle="#bbb";ctx.lineWidth=1;ctx.strokeRect(700,500,300,120);ctx.fillText("SOFÁ",850,565);
ctx.fillStyle="#aaa";ctx.font="11px sans-serif";ctx.fillText("SALA",600,400);
}
else if(tpl==="cozinha"){
ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,850);ctx.strokeStyle="#333";ctx.lineWidth=3;ctx.strokeRect(200,100,800,650);
ctx.strokeStyle="#bbb";ctx.lineWidth=1.5;ctx.fillStyle="#e8e8e8";ctx.fillRect(200,100,800,80);ctx.strokeRect(200,100,800,80);
ctx.fillStyle="#333";ctx.font="10px sans-serif";ctx.textAlign="center";ctx.fillText("BANCADA / PIA",600,145);
ctx.fillRect(200,400,8,100);ctx.fillText("PORTA",190,460);
ctx.fillStyle="#aaa";ctx.font="11px sans-serif";ctx.fillText("COZINHA",600,420);
}
else if(tpl==="banheiro"){
ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,850);ctx.strokeStyle="#333";ctx.lineWidth=3;ctx.strokeRect(300,100,600,600);
ctx.strokeStyle="#bbb";ctx.lineWidth=1.5;
ctx.strokeRect(310,110,120,100);ctx.fillStyle="#333";ctx.font="9px sans-serif";ctx.textAlign="center";ctx.fillText("PIA",370,165);
ctx.strokeRect(310,560,120,100);ctx.fillText("VASO",370,615);
ctx.strokeStyle="#aaa";ctx.setLineDash([4,4]);ctx.strokeRect(650,110,230,300);ctx.setLineDash([]);ctx.fillText("BOX",765,265);
ctx.fillRect(300,350,8,80);ctx.fillText("PORTA",290,400);
ctx.fillStyle="#aaa";ctx.font="11px sans-serif";ctx.fillText("BANHEIRO",600,460);
}
else if(tpl==="area_servico"){
ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,850);ctx.strokeStyle="#333";ctx.lineWidth=3;ctx.strokeRect(250,100,700,600);
ctx.strokeStyle="#bbb";ctx.lineWidth=1.5;ctx.strokeRect(260,110,150,100);
ctx.fillStyle="#333";ctx.font="9px sans-serif";ctx.textAlign="center";ctx.fillText("TANQUE",335,165);
ctx.fillRect(250,380,8,100);ctx.fillText("PORTA",240,440);
ctx.fillStyle="#aaa";ctx.font="11px sans-serif";ctx.fillText("ÁREA DE SERVIÇO",600,420);
}
else if(tpl==="garagem"){
ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,850);ctx.strokeStyle="#333";ctx.lineWidth=3;
ctx.moveTo(200,100);ctx.lineTo(1000,100);ctx.lineTo(1000,750);ctx.lineTo(200,750);ctx.lineTo(200,100);ctx.stroke();
ctx.strokeStyle="#bbb";ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(200,750);ctx.lineTo(1000,750);ctx.stroke();ctx.setLineDash([]);
ctx.fillStyle="#333";ctx.font="10px sans-serif";ctx.textAlign="center";ctx.fillText("PORTÃO",600,770);
ctx.fillStyle="#aaa";ctx.font="11px sans-serif";ctx.fillText("GARAGEM",600,420);
}
else if(tpl==="casa_simples"){
ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,850);ctx.strokeStyle="#333";ctx.lineWidth=3;
ctx.strokeRect(100,80,1000,700);
ctx.lineWidth=2;ctx.moveTo(500,80);ctx.lineTo(500,500);ctx.stroke();ctx.moveTo(100,500);ctx.lineTo(800,500);ctx.stroke();ctx.moveTo(800,500);ctx.lineTo(800,780);ctx.stroke();
ctx.fillStyle="#333";ctx.font="12px sans-serif";ctx.textAlign="center";
ctx.fillText("SALA",300,300);ctx.fillText("QUARTO",750,300);ctx.fillText("COZINHA",450,650);ctx.fillText("BANHEIRO",950,650);
ctx.fillStyle="#ddd";ctx.fillRect(100,300,8,100);ctx.fillStyle="#333";ctx.font="9px sans-serif";ctx.fillText("PORTA",85,360);
}
else if(tpl==="apartamento"){
ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,850);ctx.strokeStyle="#333";ctx.lineWidth=3;ctx.strokeRect(50,50,1100,750);
ctx.lineWidth=2;
ctx.moveTo(400,50);ctx.lineTo(400,400);ctx.stroke();ctx.moveTo(750,50);ctx.lineTo(750,400);ctx.stroke();
ctx.moveTo(50,400);ctx.lineTo(1150,400);ctx.stroke();
ctx.moveTo(550,400);ctx.lineTo(550,800);ctx.stroke();ctx.moveTo(850,400);ctx.lineTo(850,650);ctx.stroke();ctx.moveTo(850,650);ctx.lineTo(1150,650);ctx.stroke();
ctx.fillStyle="#333";ctx.font="12px sans-serif";ctx.textAlign="center";
ctx.fillText("QUARTO 1",225,230);ctx.fillText("QUARTO 2",575,230);ctx.fillText("SALA",900,230);
ctx.fillText("COZINHA",300,600);ctx.fillText("CORREDOR",700,520);ctx.fillText("BANH. 1",1000,540);ctx.fillText("BANH. 2",1000,730);
}
else if(tpl==="barraco"){
ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,850);ctx.strokeStyle="#333";ctx.lineWidth=3;ctx.strokeRect(200,150,800,550);
ctx.lineWidth=1.5;ctx.setLineDash([6,4]);ctx.moveTo(600,150);ctx.lineTo(600,700);ctx.stroke();ctx.setLineDash([]);
ctx.fillStyle="#333";ctx.font="12px sans-serif";ctx.textAlign="center";ctx.fillText("CÔMODO 1",400,430);ctx.fillText("CÔMODO 2",800,430);
ctx.fillStyle="#ddd";ctx.fillRect(200,350,8,100);ctx.fillStyle="#333";ctx.font="9px sans-serif";ctx.fillText("PORTA",185,410);
}
else if(tpl==="lote_vazio"){
ctx.fillStyle="#e8e0d0";ctx.fillRect(0,0,1200,850);
ctx.strokeStyle="#333";ctx.lineWidth=3;ctx.strokeRect(100,100,1000,550);
ctx.fillStyle="#ccc";ctx.fillRect(100,650,1000,40);ctx.fillStyle="#808080";ctx.fillRect(100,690,1000,80);
ctx.fillStyle="#333";ctx.font="11px sans-serif";ctx.textAlign="center";ctx.fillText("CALÇADA",600,675);ctx.fillText("RUA",600,740);ctx.fillText("LOTE",600,380);
ctx.strokeStyle="#999";ctx.lineWidth=1;ctx.setLineDash([8,4]);ctx.moveTo(100,100);ctx.lineTo(100,650);ctx.stroke();ctx.moveTo(1100,100);ctx.lineTo(1100,650);ctx.stroke();ctx.setLineDash([]);
}
else if(tpl==="cela"){
ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,850);ctx.strokeStyle="#333";ctx.lineWidth=4;ctx.strokeRect(300,100,600,650);
ctx.lineWidth=1.5;ctx.strokeRect(310,110,200,150);ctx.fillStyle="#333";ctx.font="9px sans-serif";ctx.textAlign="center";ctx.fillText("BELICHE",410,190);
ctx.strokeRect(700,550,150,150);ctx.fillText("VASO",775,630);
ctx.strokeStyle="#666";ctx.lineWidth=2;for(let x=320;x<880;x+=40){ctx.moveTo(x,750);ctx.lineTo(x,700);ctx.stroke();}
ctx.fillStyle="#333";ctx.font="10px sans-serif";ctx.fillText("GRADE",600,720);
ctx.fillStyle="#aaa";ctx.font="12px sans-serif";ctx.fillText("CELA",600,420);
}
else if(tpl==="bar_comercio"){
ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,850);ctx.strokeStyle="#333";ctx.lineWidth=3;ctx.strokeRect(100,80,1000,700);
ctx.lineWidth=2;ctx.fillStyle="#e8e8e8";ctx.fillRect(100,80,1000,100);ctx.strokeRect(100,80,1000,100);
ctx.fillStyle="#333";ctx.font="10px sans-serif";ctx.textAlign="center";ctx.fillText("BALCÃO",600,135);
for(let i=0;i<4;i++){const cx2=250+i*220,cy=450;ctx.strokeStyle="#bbb";ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx2,cy,40,0,Math.PI*2);ctx.stroke();ctx.fillText("MESA",cx2,455);}
ctx.fillStyle="#ddd";ctx.fillRect(400,780,400,8);ctx.fillStyle="#333";ctx.fillText("ENTRADA",600,800);
ctx.fillStyle="#aaa";ctx.font="11px sans-serif";ctx.fillText("COMÉRCIO / BAR",600,280);
}
else if(tpl==="area_externa"){
ctx.fillStyle="#d4e8c0";ctx.fillRect(0,0,1200,850);
ctx.strokeStyle="#666";ctx.lineWidth=2;ctx.setLineDash([10,6]);ctx.strokeRect(100,100,1000,650);ctx.setLineDash([]);
ctx.fillStyle="#4a7c3f";for(let x=150;x<1100;x+=250){ctx.beginPath();ctx.arc(x,180,25,0,Math.PI*2);ctx.fill();}
ctx.fillStyle="#ccc";ctx.fillRect(100,750,1000,30);ctx.fillStyle="#808080";ctx.fillRect(100,780,1000,50);
ctx.fillStyle="#333";ctx.font="10px sans-serif";ctx.textAlign="center";ctx.fillText("CALÇADA",600,770);ctx.fillText("RUA",600,810);
ctx.fillStyle="rgba(0,0,0,0.3)";ctx.font="12px sans-serif";ctx.fillText("ÁREA EXTERNA / TERRENO",600,430);
}
else if(tpl==="veiculo_sup"){
ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,850);
ctx.strokeStyle="#333";ctx.lineWidth=2;
ctx.beginPath();ctx.moveTo(400,100);ctx.quadraticCurveTo(600,60,800,100);ctx.lineTo(820,300);ctx.quadraticCurveTo(830,420,820,550);ctx.lineTo(800,750);ctx.quadraticCurveTo(600,790,400,750);ctx.lineTo(380,550);ctx.quadraticCurveTo(370,420,380,300);ctx.closePath();ctx.stroke();
ctx.strokeStyle="#999";ctx.lineWidth=1;ctx.moveTo(380,300);ctx.lineTo(820,300);ctx.stroke();ctx.moveTo(380,550);ctx.lineTo(820,550);ctx.stroke();
ctx.beginPath();ctx.arc(380,250,30,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(820,250,30,0,Math.PI*2);ctx.stroke();
ctx.beginPath();ctx.arc(380,620,30,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(820,620,30,0,Math.PI*2);ctx.stroke();
ctx.fillStyle="#333";ctx.font="10px sans-serif";ctx.textAlign="center";
ctx.fillText("DIANT.",600,200);ctx.fillText("TRAS.",600,680);ctx.fillText("BANCO MOT.",500,400);ctx.fillText("BANCO PASS.",700,400);
ctx.fillText("VEÍCULO (VISTA SUPERIOR)",600,830);
}
else if(tpl==="grade"){
ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,850);
ctx.strokeStyle="#c0d0e0";ctx.lineWidth=0.3;for(let x=0;x<1200;x+=20){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,850);ctx.stroke();}for(let y=0;y<850;y+=20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1200,y);ctx.stroke();}
ctx.strokeStyle="#90a0b0";ctx.lineWidth=0.6;for(let x=0;x<1200;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,850);ctx.stroke();}for(let y=0;y<850;y+=100){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1200,y);ctx.stroke();}
}
else if(tpl==="legenda"){
ctx.fillStyle="#fff";ctx.fillRect(0,0,1200,850);ctx.strokeStyle="#333";ctx.lineWidth=2;ctx.strokeRect(30,30,1140,790);
ctx.strokeRect(850,640,310,170);ctx.fillStyle="#333";ctx.font="bold 11px sans-serif";ctx.textAlign="left";
ctx.fillText("LEGENDA:",860,660);ctx.font="10px sans-serif";
for(let i=0;i<6;i++){ctx.fillText((i+1)+". _______________",860,680+i*20);}
ctx.strokeRect(850,570,310,70);ctx.font="bold 11px sans-serif";ctx.fillText("Oc.:",860,590);ctx.fillText("Perito:",860,610);ctx.fillText("Data:",1000,590);
ctx.strokeStyle="#333";ctx.lineWidth=1.5;ctx.moveTo(1120,50);ctx.lineTo(1120,100);ctx.stroke();ctx.beginPath();ctx.moveTo(1114,60);ctx.lineTo(1120,50);ctx.lineTo(1126,60);ctx.fill();ctx.font="bold 12px sans-serif";ctx.textAlign="center";ctx.fillText("N",1120,45);
}
// Novos templates (v189) - geradores genéricos
else if(tpl==="curva"){ctx.fillStyle="#888";ctx.beginPath();ctx.arc(600,1100,820,Math.PI,Math.PI*1.4);ctx.lineTo(600,500);ctx.arc(600,1100,700,Math.PI*1.4,Math.PI,true);ctx.closePath();ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.setLineDash([20,15]);ctx.beginPath();ctx.arc(600,1100,760,Math.PI,Math.PI*1.4);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#666";ctx.font="bold 14px sans-serif";ctx.textAlign="center";ctx.fillText("CURVA",600,420);}
else if(tpl==="ponte"){ctx.fillStyle="#bbb";ctx.fillRect(0,300,1200,200);ctx.strokeStyle="#888";ctx.lineWidth=4;ctx.strokeRect(0,300,1200,200);ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.setLineDash([20,15]);ctx.beginPath();ctx.moveTo(0,400);ctx.lineTo(1200,400);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#5ac8fa";ctx.fillRect(0,500,1200,150);ctx.fillStyle="#5ac8fa";ctx.fillRect(0,150,1200,150);ctx.fillStyle="#666";ctx.font="bold 18px sans-serif";ctx.textAlign="center";ctx.fillText("PONTE",600,260);ctx.fillText("RIO",600,580);ctx.fillText("RIO",600,230);}
else if(tpl==="viaduto"){ctx.fillStyle="#888";ctx.fillRect(0,250,1200,140);ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.setLineDash([20,15]);ctx.beginPath();ctx.moveTo(0,320);ctx.lineTo(1200,320);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#666";ctx.font="bold 14px sans-serif";ctx.textAlign="center";ctx.fillText("VIADUTO (NÍVEL SUPERIOR)",600,230);ctx.fillStyle="#aaa";ctx.fillRect(0,520,1200,140);ctx.strokeStyle="#fff";ctx.setLineDash([20,15]);ctx.beginPath();ctx.moveTo(0,590);ctx.lineTo(1200,590);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#666";ctx.fillText("VIA INFERIOR",600,500);ctx.fillStyle="#444";ctx.fillRect(280,390,40,130);ctx.fillRect(880,390,40,130);}
else if(tpl==="ciclovia"){ctx.fillStyle="#888";ctx.fillRect(0,300,1200,250);ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.setLineDash([20,15]);ctx.beginPath();ctx.moveTo(0,360);ctx.lineTo(1200,360);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#a4cf6f";ctx.fillRect(0,420,1200,60);ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.strokeRect(0,420,1200,60);ctx.fillStyle="#fff";ctx.font="bold 26px sans-serif";ctx.textAlign="center";ctx.fillText("🚲",600,460);ctx.fillStyle="#666";ctx.font="bold 12px sans-serif";ctx.fillText("CICLOVIA",100,455);}
else if(tpl==="corredor"){ctx.strokeStyle="#333";ctx.lineWidth=4;ctx.strokeRect(150,300,900,250);ctx.fillStyle="#fff";ctx.fillRect(150,300,900,250);ctx.strokeStyle="#333";ctx.strokeRect(150,300,900,250);ctx.fillStyle="#fff";ctx.fillRect(420,295,80,10);ctx.fillRect(700,295,80,10);ctx.fillStyle="#666";ctx.font="bold 14px sans-serif";ctx.textAlign="center";ctx.fillText("CORREDOR",600,440);ctx.font="11px sans-serif";ctx.fillText("(porta)",460,290);ctx.fillText("(porta)",740,290);}
else if(tpl==="escritorio"){ctx.strokeStyle="#333";ctx.lineWidth=4;ctx.strokeRect(200,200,800,500);ctx.fillStyle="#a87838";ctx.fillRect(280,300,200,90);ctx.strokeStyle="#333";ctx.lineWidth=2;ctx.strokeRect(280,300,200,90);ctx.fillStyle="#444";ctx.fillRect(360,395,40,40);ctx.fillStyle="#888";ctx.fillRect(700,250,250,80);ctx.strokeRect(700,250,250,80);ctx.fillStyle="#666";ctx.font="bold 14px sans-serif";ctx.textAlign="center";ctx.fillText("ESCRITÓRIO",600,180);ctx.font="11px sans-serif";ctx.fillText("Mesa",380,355);ctx.fillText("Estante",825,295);}
else if(tpl==="varanda"){ctx.strokeStyle="#333";ctx.lineWidth=4;ctx.strokeRect(150,250,900,350);for(let x=170;x<1050;x+=40){ctx.fillStyle="#666";ctx.fillRect(x,580,8,20);}ctx.fillStyle="#666";ctx.font="bold 14px sans-serif";ctx.textAlign="center";ctx.fillText("VARANDA",600,420);ctx.font="11px sans-serif";ctx.fillText("(guarda-corpo)",600,640);}
else if(tpl==="quintal"){ctx.fillStyle="#a4cf6f";ctx.fillRect(150,200,900,500);ctx.strokeStyle="#333";ctx.lineWidth=4;ctx.strokeRect(150,200,900,500);ctx.fillStyle="#3a7d2e";ctx.beginPath();ctx.arc(280,330,40,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(900,560,50,0,Math.PI*2);ctx.fill();ctx.fillStyle="#888";ctx.fillRect(450,440,300,200);ctx.strokeRect(450,440,300,200);ctx.fillStyle="#666";ctx.font="bold 14px sans-serif";ctx.textAlign="center";ctx.fillText("QUINTAL",600,180);ctx.fillText("(área externa)",600,545);}
else if(tpl==="sobrado"){ctx.strokeStyle="#333";ctx.lineWidth=4;ctx.strokeRect(150,150,900,300);ctx.strokeRect(150,470,900,250);ctx.beginPath();ctx.moveTo(150,460);ctx.lineTo(1050,460);ctx.stroke();ctx.fillStyle="#666";ctx.font="bold 14px sans-serif";ctx.textAlign="center";ctx.fillText("PAVIMENTO SUPERIOR",600,300);ctx.fillText("PAVIMENTO TÉRREO",600,600);ctx.font="11px sans-serif";ctx.fillStyle="#999";ctx.fillText("(quartos)",600,330);ctx.fillText("(sala/cozinha)",600,630);}
else if(tpl==="kitnet"){ctx.strokeStyle="#333";ctx.lineWidth=4;ctx.strokeRect(300,250,600,400);ctx.beginPath();ctx.moveTo(670,250);ctx.lineTo(670,420);ctx.stroke();ctx.beginPath();ctx.moveTo(670,420);ctx.lineTo(900,420);ctx.stroke();ctx.fillStyle="#666";ctx.font="bold 12px sans-serif";ctx.textAlign="center";ctx.fillText("QUARTO/SALA",480,440);ctx.fillText("COZINHA",780,330);ctx.fillText("BANHEIRO",780,510);ctx.fillStyle="#fff";ctx.fillRect(295,500,10,60);}
else if(tpl==="chacara"){ctx.fillStyle="#a4cf6f";ctx.fillRect(50,50,1100,750);ctx.strokeStyle="#333";ctx.lineWidth=3;ctx.strokeRect(50,50,1100,750);ctx.fillStyle="#888";ctx.fillRect(450,300,300,200);ctx.strokeRect(450,300,300,200);ctx.fillStyle="#3a7d2e";for(let i=0;i<8;i++){ctx.beginPath();ctx.arc(150+i*120,150,28,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(150+i*120,700,28,0,Math.PI*2);ctx.fill();}ctx.fillStyle="#666";ctx.font="bold 14px sans-serif";ctx.textAlign="center";ctx.fillText("CHÁCARA / SÍTIO",600,30);ctx.fillText("CASA",600,400);}
else if(tpl==="igreja"){ctx.strokeStyle="#333";ctx.lineWidth=4;ctx.strokeRect(300,250,600,400);ctx.beginPath();ctx.moveTo(300,250);ctx.lineTo(600,150);ctx.lineTo(900,250);ctx.stroke();ctx.beginPath();ctx.moveTo(580,150);ctx.lineTo(580,80);ctx.lineTo(620,80);ctx.lineTo(620,150);ctx.stroke();ctx.beginPath();ctx.moveTo(600,80);ctx.lineTo(600,40);ctx.moveTo(585,55);ctx.lineTo(615,55);ctx.stroke();for(let i=0;i<5;i++){ctx.fillStyle="#a87838";ctx.fillRect(360+i*100,420,80,20);ctx.fillRect(360+i*100,500,80,20);ctx.fillRect(360+i*100,580,80,20);}ctx.fillStyle="#666";ctx.font="bold 14px sans-serif";ctx.textAlign="center";ctx.fillText("IGREJA / TEMPLO",600,720);ctx.font="11px sans-serif";ctx.fillText("(bancos)",600,640);}
else if(tpl==="posto_saude"){ctx.strokeStyle="#333";ctx.lineWidth=4;ctx.strokeRect(200,200,800,500);ctx.fillStyle="#dc3545";ctx.fillRect(560,80,80,30);ctx.fillRect(585,55,30,80);ctx.fillStyle="#fff";ctx.font="bold 13px sans-serif";ctx.textAlign="center";ctx.fillText("HOSPITAL",600,103);ctx.beginPath();ctx.moveTo(200,400);ctx.lineTo(1000,400);ctx.stroke();ctx.beginPath();ctx.moveTo(450,200);ctx.lineTo(450,400);ctx.stroke();ctx.beginPath();ctx.moveTo(750,200);ctx.lineTo(750,400);ctx.stroke();ctx.fillStyle="#666";ctx.font="bold 12px sans-serif";ctx.fillText("RECEPÇÃO",325,310);ctx.fillText("CONSULT.",600,310);ctx.fillText("FARM.",875,310);ctx.fillText("ESPERA",600,560);ctx.font="bold 14px sans-serif";ctx.fillText("POSTO DE SAÚDE",600,180);}
else if(tpl==="escola"){ctx.strokeStyle="#333";ctx.lineWidth=4;ctx.strokeRect(150,200,900,500);ctx.beginPath();ctx.moveTo(150,400);ctx.lineTo(1050,400);ctx.stroke();ctx.beginPath();ctx.moveTo(450,200);ctx.lineTo(450,400);ctx.stroke();ctx.beginPath();ctx.moveTo(750,200);ctx.lineTo(750,400);ctx.stroke();ctx.beginPath();ctx.moveTo(450,400);ctx.lineTo(450,700);ctx.stroke();ctx.beginPath();ctx.moveTo(750,400);ctx.lineTo(750,700);ctx.stroke();ctx.fillStyle="#666";ctx.font="bold 11px sans-serif";ctx.textAlign="center";ctx.fillText("SALA 1",300,310);ctx.fillText("SALA 2",600,310);ctx.fillText("SALA 3",900,310);ctx.fillText("SALA 4",300,560);ctx.fillText("PÁTIO",600,560);ctx.fillText("BIBLIO.",900,560);ctx.font="bold 14px sans-serif";ctx.fillText("ESCOLA",600,180);}
else if(tpl==="galpao"){ctx.strokeStyle="#333";ctx.lineWidth=4;ctx.strokeRect(150,250,900,400);ctx.beginPath();ctx.moveTo(150,250);ctx.lineTo(600,150);ctx.lineTo(1050,250);ctx.stroke();for(let x=200;x<1050;x+=80){ctx.beginPath();ctx.moveTo(x,250);ctx.lineTo(x,650);ctx.strokeStyle="#aaa";ctx.lineWidth=1;ctx.stroke();}ctx.strokeStyle="#333";ctx.lineWidth=4;ctx.fillStyle="#fff";ctx.fillRect(560,500,80,150);ctx.strokeRect(560,500,80,150);ctx.fillStyle="#666";ctx.font="bold 14px sans-serif";ctx.textAlign="center";ctx.fillText("GALPÃO / DEPÓSITO",600,720);ctx.font="11px sans-serif";ctx.fillText("(porta)",600,490);}
else if(tpl==="edificio"){ctx.strokeStyle="#333";ctx.lineWidth=4;ctx.strokeRect(400,80,400,720);for(let y=150;y<800;y+=85){ctx.beginPath();ctx.moveTo(400,y);ctx.lineTo(800,y);ctx.stroke();}for(let y=110;y<780;y+=85){ctx.fillStyle="#5ac8fa";for(let x=0;x<3;x++){ctx.fillRect(420+x*120,y,80,40);}}ctx.fillStyle="#444";ctx.fillRect(560,720,80,80);ctx.fillStyle="#666";ctx.font="bold 14px sans-serif";ctx.textAlign="center";ctx.fillText("EDIFÍCIO",600,60);ctx.font="11px sans-serif";ctx.fillText("(entrada)",600,815);}

ctx.restore();templateRef.current=ctx.getImageData(0,0,1200,850);
// Save to imgRef SYNCHRONOUSLY (not via sv/rAF) to prevent race condition with useEffect
const tmp2=document.createElement("canvas");tmp2.width=1200;tmp2.height=850;tmp2.getContext("2d").drawImage(c,0,0);imgRef.current[desenhoIdx]=tmp2.toDataURL();
// NOW safe to trigger state updates (useEffect will find the new image)
setStampObjs(so=>so.filter(s2=>s2.sheet!==desenhoIdx));setSelStamp(null);};

// Export
const pCSS=`@page{size:A4;margin:25mm 15mm 20mm 15mm}@page{@bottom-center{content:"Croqui de Levantamento de Local — pág. " counter(page) " de " counter(pages) " — SCPe/IC/DPT/PCDF";font-size:9px;color:#666;font-family:Arial,Helvetica,sans-serif}}*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body,html{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#1A1A1A;line-height:1.55;padding:15px;margin:0}table{width:100%;border-collapse:collapse}td,th{line-height:1.5}img{max-width:100%}h2,h3,h4,h5,h6{font-family:Arial,Helvetica,sans-serif}`;
// v235: bibliotecas (html2pdf, JSZip) agora vêm do bundle local via import,
// não mais via fetch a CDN com cache em localStorage. Vantagens:
//  • Sem risco de cdnjs comprometido executar código no app forense
//  • Sem cache de 30 dias em localStorage que poderia perpetuar comprometimento
//  • Funciona offline desde a primeira carga (sem precisar baixar de rede)
//  • CSP mais restritiva (script-src 'self') passa a ser viável
// Mantemos as funções loadH2P/loadJSZip como wrappers async para preservar
// a assinatura usada no resto do código (await loadH2P()).
const loadH2P=async()=>html2pdf;
  // ──────────────────────────────────────────
  // MAPA — Abre Google Maps + sobe screenshot como base do canvas
  // ──────────────────────────────────────────
  const openMaps=()=>{
    const gps=data.gps||"";
    if(gps){
      const clean=gps.replace(/[^\d.,-]/g,"");
      const parts=clean.split(",").map(Number);
      if(parts.length>=2&&!isNaN(parts[0])&&!isNaN(parts[1])){
        window.open(`https://www.google.com/maps/@${parts[0]},${parts[1]},18z`,"_blank","noopener,noreferrer");
        return;
      }
    }
    window.open("https://www.google.com/maps","_blank","noopener,noreferrer");
  };
  const loadMapImg=(ev)=>{
    const fl=ev.target.files?.[0];if(!fl)return;
    const reader=new FileReader();
    reader.onload=(e)=>{
      const img=new Image();
      img.onload=()=>{
        const c=canvasRef.current,ctx=ctxRef.current;if(!c||!ctx)return;
        // Limpa e desenha como fundo
        ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);
        // Mantém proporção
        const scale=Math.min(c.width/img.width,c.height/img.height);
        const w=img.width*scale,h=img.height*scale;
        const x=(c.width-w)/2,y=(c.height-h)/2;
        ctx.drawImage(img,x,y,w,h);
        // Salva mapa como template de proteção — borracha NÃO vai apagar
        const snapshot=ctx.getImageData(0,0,1200,850);
        templateRef.current=snapshot;
        templatesRef.current[desenhoIdx]=snapshot;
        sv();showToast("✅ Mapa inserido como base do croqui (protegido da borracha)!");
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(fl);
    ev.target.value="";
  };

  // ──────────────────────────────────────────
  // EXPORTAÇÃO — PDF, DOCX e funções auxiliares
  // savePDF: gera PDF via html2pdf.js
  // saveCroquiDocx: gera .docx real (OOXML/JSZip) direto dos dados
  // copyHTML: copia HTML para clipboard
  // ──────────────────────────────────────────

  // ──────────────────────────────────────────
  // CANVAS — Captura mapa OSM na localização atual
  // Usa tiles do OpenStreetMap, monta grid 3x3
  // ──────────────────────────────────────────
const savePDF=async(title)=>{
// R6: PDFs com muitas fotos podem travar iOS Safari (OOM). Avisa e dá saída.
if(fotos.length>50){const ok=await confirmAsync(`Muitas fotos no PDF (${fotos.length})`,`Gerar PDF com mais de 50 fotos pode:\n• Travar o navegador (iOS especialmente)\n• Demorar 1-2 minutos\n• Gerar arquivo > 50 MB\n\nAlternativa recomendada: baixe DOCX (mais leve) e fotos pelo backup JSON.\n\nContinuar mesmo assim?`,{okLabel:"Continuar mesmo assim",okIcon:"📄",danger:false,cancelLabel:"Usar DOCX"});if(!ok){setCopyOk("Cancelado — use DOCX para muitas fotos.");setTimeout(()=>setCopyOk(""),4000);return;}}
setPdfBusy(true);setCopyOk("Gerando PDF…");if(pdfDataUrl)try{URL.revokeObjectURL(pdfDataUrl);}catch(e){console.warn("CQ:",e);}setPdfDataUrl(null);try{const html2pdf=await loadH2P();const el=document.getElementById("pdf-preview");if(!el)throw new Error("Preview não encontrado");const pdfObj=await html2pdf().set({margin:[14,8,14,8],filename:mkFileName("pdf",title==="RRV"?"RRV":"Croqui"),image:{type:"jpeg",quality:0.95},html2canvas:{scale:2,useCORS:true,logging:false},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"},pagebreak:{mode:["avoid-all","css","legacy"]}}).from(el).toPdf().get("pdf");const totalPages=pdfObj.internal.getNumberOfPages();const pageW=pdfObj.internal.pageSize.getWidth();const pageH=pdfObj.internal.pageSize.getHeight();for(let i=1;i<=totalPages;i++){pdfObj.setPage(i);pdfObj.setFontSize(7);pdfObj.setTextColor(150);pdfObj.text(`Oc.: ${data.oc||"___"}/${data.oc_ano||""} | DP: ${data.dp||""} | Perito: ${data.p1||"___"}`,pageW/2,8,{align:"center"});pdfObj.text(`Página ${i} de ${totalPages}`,pageW/2,pageH-5,{align:"center"});}const blob=pdfObj.output("blob");setCopyOk("");
// v239: baixa direto, sem mostrar passo intermediário com botões "Visualizar/Baixar".
await smartSavePdf(blob,title);
}catch(e){setCopyOk("Erro: "+e.message);setTimeout(()=>setCopyOk(""),6000);}finally{setPdfBusy(false);}};
const loadJSZip=async()=>JSZip;
const X=(s)=>{if(!s)return"";const v=Array.isArray(s)?s.join(", "):String(s);return v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");};
const saveCroquiDocx=async(returnBlobOnly=false)=>{
  /* v201: forceSaveCanvas pode falhar (canvas vazio/quebrado) — não pode bloquear o DOCX */
  try{forceSaveCanvas();}catch(eFsc){console.warn("forceSaveCanvas falhou (continuando):",eFsc);}
  try{
    if(!returnBlobOnly)showToast("⏳ Gerando laudo...");
    const JSZip=await loadJSZip();
    if(!JSZip)throw new Error("Não foi possível carregar JSZip — verifique sua internet");
    const zip=new JSZip();const d=data;const oc=d.oc||"___";const ano=d.oc_ano||"____";const dp=d.dp==="Outro"?(d.dp_outro||"___"):(d.dp||"___");
/* v201: esc2 reforçado — strip de control chars que quebram XML (zero-width, BOMs etc.) */
const esc2=(s)=>String(s??"").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
const Pp=(text,opts={})=>{const sz=opts.sz||20;const bold=opts.bold?'<w:b/>':"";const italic=opts.italic?'<w:i/>':"";const color=opts.color?`<w:color w:val="${opts.color}"/>`:"";const caps=opts.caps?'<w:caps/>':"";const center=opts.center?'<w:jc w:val="center"/>':(opts.right?'<w:jc w:val="right"/>':(opts.justify?'<w:jc w:val="both"/>':""));const shd=opts.shd?`<w:shd w:val="clear" w:color="auto" w:fill="${opts.shd}"/>`:"";const ind=opts.indFirst?`<w:ind w:firstLine="${opts.indFirst}"/>`:"";const spAft=opts.spAft!==undefined?opts.spAft:120;const spBef=opts.spBef!==undefined?opts.spBef:0;const spacing=`<w:spacing w:before="${spBef}" w:after="${spAft}" w:line="320" w:lineRule="auto"/>`;const brd=opts.border?`<w:pBdr>${opts.border}</w:pBdr>`:"";const keepNext=opts.keepNext?'<w:keepNext/>':"";const keepLines=opts.keepLines?'<w:keepLines/>':"";const pPr=`<w:pPr>${keepNext}${keepLines}${center}${brd}${spacing}${ind}${shd?`<w:shd w:val="clear" w:color="auto" w:fill="${opts.shd}"/>`:""}<w:rPr>${bold}${italic}<w:sz w:val="${sz}"/>${color}</w:rPr></w:pPr>`;return`<w:p>${pPr}<w:r><w:rPr>${bold}${italic}${caps}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>${color}</w:rPr><w:t xml:space="preserve">${esc2(text)}</w:t></w:r></w:p>`;};
// H1_NUM: numbered top-level section "1 HISTÓRICO"
const H1_NUM=(num,title)=>Pp(`${num} ${title}`,{bold:true,sz:28,caps:true,spBef:280,spAft:140,color:"1A1A2E"});
// H2_NUM: numbered subsection "4.1 Do Local"
const H2_NUM=(num,title)=>Pp(`${num} ${title}`,{bold:true,sz:26,spBef:200,spAft:140,color:"1A1A2E"});
// H3_NUM: numbered sub-subsection "4.3.1 Descrição"
const H3_NUM=(num,title)=>Pp(`${num} ${title}`,{bold:true,italic:true,sz:24,spBef:140,spAft:100,color:"1A1A2E"});
// H_CENTER: centered heading like "PREÂMBULO"
const H_CENTER=(text)=>Pp(text,{bold:true,sz:28,caps:true,center:true,spBef:280,spAft:140,color:"1A1A2E"});
// PARA: normal paragraph with justify and first-line indent
const PARA=(text)=>Pp(text,{sz:22,justify:true,indFirst:709,spAft:140});
// ROW_ZEBRA: alternating row color
const ROW_Z=(l,v,idx)=>{if(!v&&v!==0)return"";const fill=(idx%2===0)?"F5F5F7":"FFFFFF";return`<w:tr><w:tc><w:tcPr><w:tcW w:w="3200" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E8E8EC"/></w:tcPr>${Pp(l,{bold:true,sz:20,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="6800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(String(v),{sz:20,spAft:0})}
</w:tc></w:tr>`;};
// ROW_GOLD: linha estilo dourado (label em E8D9A8, valor zebrado FFF8E8/FFFCEF)
// cantSplit: linha não quebra entre páginas
// "A esclarecer", "—", etc → itálico cinza (campo pendente)
const isPendingValue=(v)=>{const s=String(v||"").trim().toLowerCase();return s==="a esclarecer"||s==="—"||s==="-"||s==="a ser informado"||s==="a ser descrito";};
const ROW_GOLD=(l,v,idx)=>{if(!v&&v!==0)return"";const fill=(idx%2===0)?"FFF8E8":"FFFCEF";const pending=isPendingValue(v);const valOpts=pending?{sz:20,spAft:0,italic:true,color:"9A8B6A"}:{sz:20,spAft:0};return`<w:tr><w:trPr><w:cantSplit/></w:trPr><w:tc><w:tcPr><w:tcW w:w="3200" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E8D9A8"/></w:tcPr>${Pp(l,{bold:true,sz:20,spAft:0,color:"6B5326"})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="6800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(String(v),valOpts)}
</w:tc></w:tr>`;};
// ROW_GOLD_GROUP: linha de subtítulo (colspan=2 com fundo dourado mais forte)
// cantSplit + keepNext: subtítulo não quebra e fica junto com a próxima linha (não fica órfão no fim de página)
const ROW_GOLD_GROUP=(title)=>`<w:tr><w:trPr><w:cantSplit/></w:trPr><w:tc><w:tcPr><w:tcW w:w="10000" w:type="dxa"/><w:gridSpan w:val="2"/><w:shd w:val="clear" w:color="auto" w:fill="C9A961"/></w:tcPr>${Pp(title,{bold:true,sz:20,caps:true,spAft:0,color:"FFFFFF",keepNext:true,keepLines:true})}
</w:tc></w:tr>`;
const TBL_Z=(rowsArr)=>{let r="";rowsArr.filter(x=>x).forEach((item,i)=>{if(typeof item==="string"){r+=item.replace(/<!--IDX-->/g,String(i));}else{r+=ROW_Z(item[0],item[1],i);}});if(!r)return"";return`<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="10000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:left w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:right w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E6"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E0E0E6"/></w:tblBorders></w:tblPr>${r}</w:tbl>`;};
// TBL_GOLD: tabela dourada com agrupamento. Aceita array onde:
//  - {group:"TÍTULO"} cria linha de subtítulo
//  - [label, valor] cria linha normal (skipped if valor vazio)
const TBL_GOLD=(rowsArr)=>{let r="";let visIdx=0;rowsArr.filter(x=>x).forEach((item)=>{if(item&&typeof item==="object"&&item.group){r+=ROW_GOLD_GROUP(item.group);visIdx=0;}else if(Array.isArray(item)){const out=ROW_GOLD(item[0],item[1],visIdx);if(out){r+=out;visIdx++;}}});if(!r)return"";return`<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="10000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="C9A961"/><w:left w:val="single" w:sz="6" w:space="0" w:color="C9A961"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="C9A961"/><w:right w:val="single" w:sz="6" w:space="0" w:color="C9A961"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E8D9A8"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E8D9A8"/></w:tblBorders></w:tblPr>${r}</w:tbl>`;};
const PAGE_BREAK=()=>`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
const SPACER=(sz=120)=>`<w:p><w:pPr><w:spacing w:after="${sz}"/></w:pPr></w:p>`;
// ═════════════ BODY ═════════════
let body="";
// ──── CAPA COM RESUMO EXECUTIVO ────
body+=Pp("POLÍCIA CIVIL DO DISTRITO FEDERAL",{bold:true,sz:24,center:true,spAft:60});
body+=Pp("DEPARTAMENTO DE POLÍCIA TÉCNICA",{bold:true,sz:24,center:true,spAft:60});
body+=Pp("INSTITUTO DE CRIMINALÍSTICA",{bold:true,sz:24,center:true,spAft:60});
body+=Pp("SEÇÃO DE CRIMES CONTRA A PESSOA",{bold:true,sz:24,center:true,spAft:480});
body+=Pp("CROQUI DE LEVANTAMENTO DE LOCAL",{bold:true,sz:40,center:true,spBef:600,spAft:720,color:"1A1A2E"});
// Resumo executivo (tabela)
const natLbl=d.nat==="Outros"?(d.nat_outro||"—"):(d.nat||"—");
const perito1=d.p1||loginName||"—";
const perito2=d.p2||"";
const matP1=d.mat_p1||loginMat||"";
const matP2=d.mat_p2||"";
const peritoLabel=perito2?`${perito1}${matP1?" (mat. "+matP1+")":""} e ${perito2}${matP2?" (mat. "+matP2+")":""}`:`${perito1}${matP1?" (mat. "+matP1+")":""}`;
const diagCad=d.c0_dg||"—";
const cadCount=cadaveres.filter((_,ci)=>d[`c${ci}_fx`]||d[`c${ci}_dg`]||d[`c${ci}_sx`]||wounds.some(w=>w.cadaver===ci)).length;
const vestTotal=vestigios.filter(v=>v.desc).length+canvasVest.filter(v=>v.desc).length;
const vestRecolhidos=[...vestigios.filter(v=>v.desc&&v.recolhido==="Sim"),...canvasVest.filter(v=>v.desc&&v.recolhido==="Sim")].length;
// === RESUMO EXECUTIVO (DOCX) ===
// v234: valores vazios retornam "" em vez de placeholders ("Sem cadáver", "—", etc).
// A função keepRow() mais abaixo filtra linhas vazias antes de gerar a tabela.
const cadDescDx=(()=>{const partes=[];cadaveres.forEach((c,ci)=>{const cx2=`c${ci}_`;const fx=d[cx2+"fx"]||"";const sx=d[cx2+"sx"]||"";const et=d[cx2+"et"]||"";if(fx||sx){partes.push([sx,et,fx].filter(x=>x&&x!=="Prejudicado"&&x!=="Prejudicada").join(", ")||"Cadáver "+(ci+1));}});return partes.length?partes.join("; "):"";})();
const instrumentoExecDx=(()=>{const ins=d.c0_ins||"";const insO=d.c0_ins_o||"";const sui=d.c0_sui_tipo||"";return [ins,insO,sui].filter(Boolean).filter(x=>x!=="Outro").join(" / ")||"";})();
const woundsTotalDx=wounds.length;
const agenteLbl=d.ag==="Outro"?(d.ag_outro||""):(d.ag||"");
const papiloLbl=d.pp?`${d.pp==="Outro"?(d.pp_outro||""):d.pp}${d.mat_pp?` (mat. ${d.mat_pp})`:""}`:"";
const viaturaLbl=d.vt==="Outra"?(d.vt_outro||""):(d.vt||"");
const oicLbl=d.oic||"";
// Tipo do local (d.tp é array de strings)
const tipoLocalLbl=Array.isArray(d.tp)&&d.tp.length?d.tp.join(", "):(d.tp||"");
// Recursos empregados (só os marcados "Sim")
const recursos=[];
if(d.drone==="Sim")recursos.push("Drone");
if(d.scanner==="Sim")recursos.push("Scanner 3D");
if(d.luminol==="Sim")recursos.push("Luminol");
if(d.luz_forense==="Sim")recursos.push("Luz forense");
const recursosLbl=recursos.length?recursos.join(", "):"";
// Contadores
const veicsComDataResumo=veiculos.filter((_,vi)=>d[`v${vi}_tipo`]||d[`v${vi}_placa`]).length;
const edifsComData=edificacoes.filter(e=>e&&(e.tipo||e.material||e.andares||(e.comodos_list&&e.comodos_list.length)||(e.comodos_fato&&e.comodos_fato.length))).length;
const trilhasComData=trilhas.filter(tr=>tr&&(tr.origem||tr.destino||tr.padrao||tr.comprimento||tr.obs)).length;
// Construir array da tabela com grupos
// v234: regra estrita — linha só aparece se tiver conteúdo útil.
// Função 'kr' (keepRow): retorna [label,val] se val tem conteúdo, senão null.
// Numéricos só aparecem se > 0.
const kr=(label,val)=>{if(val===null||val===undefined||val==="")return null;const s=String(val).trim();if(!s||s==="—"||s==="0"||s==="0 total")return null;return [label,val];};
const krNum=(label,n)=>(n>0?[label,String(n)]:null);
const resumoRowsRaw=[
  {group:"Identificação"},
  kr("Ocorrência / DP",(d.oc||d.oc_ano||d.dp)?`${oc}/${ano} — ${dp}`:""),
  kr("Natureza",natLbl),
  kr("Vítima(s)",cadDescDx),
  kr("Instrumento / meio",instrumentoExecDx),
  kr("Exame Externo",oicLbl),
  {group:"Local"},
  kr("Endereço",d.end),
  kr("GPS",d.gps),
  kr("Tipo do local",tipoLocalLbl),
  {group:"Datas"},
  kr("Data da solicitação",d.dt_sol),
  kr("Data do deslocamento",d.dt_des),
  kr("Data do atendimento",d.dt_che),
  kr("Data da finalização",d.dt_ter),
  {group:"Equipe"},
  kr("Perito(s) criminais",peritoLabel),
  kr("Agente",agenteLbl),
  kr("Papiloscopista",papiloLbl),
  kr("Viatura",viaturaLbl),
  recursos.length?["Recursos empregados",recursosLbl]:null,
  {group:"Achados"},
  kr("Diagnóstico",diagCad),
  krNum("Cadáveres",cadCount),
  vestTotal>0?["Vestígios",`${vestTotal} total${vestRecolhidos?` (${vestRecolhidos} recolhidos)`:""}`]:null,
  krNum("Lesões documentadas",woundsTotalDx),
  krNum("Edificações examinadas",edifsComData),
  krNum("Veículos examinados",veicsComDataResumo),
  krNum("Trilhas de sangue",trilhasComData),
  krNum("Fotografias",(fotos||[]).length)
];
// Remove grupos órfãos (sem nenhuma linha de dado abaixo deles antes do próximo grupo).
const resumoRows=(()=>{const out=[];for(let i=0;i<resumoRowsRaw.length;i++){const item=resumoRowsRaw[i];if(!item)continue;if(item.group){// Verifica se há ao menos 1 linha de dado entre este grupo e o próximo
let hasData=false;for(let j=i+1;j<resumoRowsRaw.length;j++){const next=resumoRowsRaw[j];if(!next)continue;if(next.group)break;hasData=true;break;}if(hasData)out.push(item);}else{out.push(item);}}return out;})();
body+=Pp("⚖️ RESUMO DA OCORRÊNCIA",{bold:true,sz:24,center:true,caps:true,spBef:280,spAft:160,color:"FFFFFF",shd:"C9A961"});
// Linha de leitura rápida (TL;DR — síntese em 1 linha pra leitura ágil)
const tldrPartes=[];
tldrPartes.push(natLbl);
if(tipoLocalLbl&&tipoLocalLbl!=="—")tldrPartes.push(`em ${tipoLocalLbl}`);
if(woundsTotalDx>0)tldrPartes.push(`${woundsTotalDx} lesão${woundsTotalDx>1?"ões":""} documentada${woundsTotalDx>1?"s":""}`);
if(vestTotal>0)tldrPartes.push(`${vestTotal} vestígio${vestTotal>1?"s":""}${vestRecolhidos?` (${vestRecolhidos} recolhido${vestRecolhidos>1?"s":""})`:""}`);
const fotosCount=(fotos||[]).length;
if(fotosCount>0)tldrPartes.push(`${fotosCount} fotografia${fotosCount>1?"s":""}`);
const tldrTexto=tldrPartes.join(" · ");
body+=Pp(tldrTexto,{sz:22,italic:true,center:true,spBef:0,spAft:200,color:"6B5326",shd:"FFFCEF"});
body+=TBL_GOLD(resumoRows);
body+=PAGE_BREAK();
// ──── PREÂMBULO ────
body+=H_CENTER("PREÂMBULO");
const dataHoje=new Date().toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"});
const peritoDesig=perito2?`Peritos Criminais ${perito1}${matP1?", matrícula "+matP1+",":""} e ${perito2}${matP2?", matrícula "+matP2+",":""}`:`Perito Criminal ${perito1}${matP1?", matrícula "+matP1+",":""}`;
const delegaciaTxt=dp!=="___"?`${dp}ª Delegacia de Polícia (${dp}ª DP)`:"Delegacia de Polícia";
body+=PARA(`Em ${dataHoje}, o Diretor do Instituto de Criminalística designou ${peritoDesig} para procederem a exame de local, descreverem minuciosamente o que examinarem e esclarecerem tudo que possa interessar a fim de atender à solicitação da autoridade da ${delegaciaTxt}.`);
const apoioPartes=[];
const agParte=d.ag==="Outro"?d.ag_outro:d.ag;
if(agParte)apoioPartes.push(`do Agente Policial ${agParte}`);
const ppParte=d.pp==="Outro"?d.pp_outro:d.pp;
if(ppParte)apoioPartes.push(`do Papiloscopista ${ppParte}${d.mat_pp?", matrícula "+d.mat_pp:""}`);
const vtParte=d.vt==="Outra"?d.vt_outro:d.vt;
if(vtParte)apoioPartes.push(`com a viatura ${vtParte}`);
if(apoioPartes.length){body+=PARA(`A equipe pericial contou com o apoio ${apoioPartes.join(", ")}.`);}
// ──── 1 HISTÓRICO ────
body+=H1_NUM("1","HISTÓRICO");
const horaSol=d.dt_sol||"horário registrado no sistema";
const enderecoHist=d.end||"endereço a ser informado";
const gpsHist=d.gps?` relacionado às coordenadas geográficas ${d.gps} (datum WGS 84)`:"";
body+=PARA(`A fim de atender à solicitação supracitada, feita via rede interna de computadores da Polícia Civil do Distrito Federal (intranet), os Peritos Criminais compareceram, às ${horaSol}, ao endereço ${enderecoHist}${gpsHist}, onde realizaram os exames descritos a seguir.`);
if(d.obs_sol){body+=PARA(`Observações da solicitação: ${d.obs_sol}`);}
// ──── 2 OBJETIVO PERICIAL ────
body+=H1_NUM("2","OBJETIVO PERICIAL");
body+=PARA(`O exame teve por objetivo a busca e a constatação, no local de solicitação ou nas suas proximidades, de elementos materiais possivelmente relacionados à Ocorrência Policial ${oc}/${ano} – ${dp}ª DP, registrada, no momento do exame, com a natureza de "${natLbl}".`);
// ──── 3 ISOLAMENTO DO LOCAL ────
body+=H1_NUM("3","ISOLAMENTO DO LOCAL E PRESENÇA DE AGENTE ESTATAL");
const isoTxt=d.iso||"a ser descrito";
const respTxt=d.rp?`sob a responsabilidade de ${d.rp}${d.mt?`, matrícula ${d.mt}`:""}${d.org?`, ${d.org}`:""}`:"";
body+=PARA(`Quando da chegada da equipe pericial, o local a ser examinado encontrava-se ${isoTxt.toLowerCase()}${respTxt?" e "+respTxt:""}.`);
if(d.pres||d.vr||d.obs_i){body+=TBL_Z([["Preservação",d.pres],["Viatura isol.",d.vr],["Observações",d.obs_i]]);}
// ──── RECURSOS EMPREGADOS ────
const recHasAny=d.drone||d.scanner||d.luminol||d.luz_forense;
if(recHasAny){body+=Pp("Recursos empregados",{bold:true,sz:22,spBef:180,spAft:80,color:"1A1A2E"});body+=TBL_Z([["Drone",d.drone||"Não"],["Scanner 3D",d.scanner||"Não"],["Luminol",d.luminol||"Não"],["Luz forense",d.luz_forense||"Não"]]);}
// ──── 4 EXAMES ────
body+=H1_NUM("4","EXAMES");
// 4.1 Do Local
body+=H2_NUM("4.1","Do Local");
const localResumo=[];
if(d.area)localResumo.push(`em área ${d.area.toLowerCase()}`);
if(d.dest)localResumo.push(`destinação ${d.dest.toLowerCase()}`);
if(d.tp)localResumo.push(`classificado como ${tpStr(d.tp).toLowerCase()}`);
if(localResumo.length){body+=PARA(`O local examinado situava-se ${localResumo.join(", ")}.`);}
body+=TBL_Z([["Endereço",d.end],["GPS",d.gps],["Área",d.area],["Destinação",d.dest],["Tipo",tpStr(d.tp)],["Via",d.via],["Iluminação",d.ilu],["Ligada",d.ilul],["Observações",d.obs_l]]);
if(tpHas(d.tp,"Via pública")){body+=SPACER();body+=Pp("Via pública — características",{bold:true,sz:20,spBef:120,spAft:60,color:"1A1A2E"});body+=TBL_Z([["Pavimento",d.vp_pav],["Faixas",d.vp_faixas],["Mão",d.vp_mao],["Canteiro central",d.vp_canteiro],d.vp_canteiro==="Sim"?["Tipo canteiro",d.vp_canteiro_tipo]:null,["Meio-fio",d.vp_meiofio],["Calçada",d.vp_calcada],["Trânsito",d.vp_transito],["Frenagem",d.vp_frenagem],d.vp_frenagem==="Sim"?["Comp. frenagem",d.vp_frenagem_comp]:null,["Derrapagem",d.vp_derrapagem],["Debris",d.vp_debris],d.vp_debris==="Sim"?["Obs debris",d.vp_debris_obs]:null,["Obs características",d.vp_obs_caract],["Obs condições",d.vp_obs_cond]]);const vpM2=[...(d.vp_mr||[]),...(d.vp_mi||[]),...(d.vp_ma||[]),...(d.vp_mac||[]),...(d.vp_me||[]),...(d.vp_mo||[])];if(vpM2.length){body+=Pp("Via pública — manchas de sangue",{bold:true,sz:20,spBef:120,spAft:60,color:"1A1A2E"});body+=TBL_Z([["Padrões identificados",vpM2.join(", ")],["Observações",d.vp_obs_manchas]]);}}
if(d.dest==="Área verde"&&(d.av_veg||d.av_obs)){body+=SPACER();body+=Pp("Área verde — vegetação",{bold:true,sz:20,spBef:120,spAft:60,color:"1A1A2E"});body+=TBL_Z([["Tipo de vegetação",d.av_veg],["Observações",d.av_obs]]);}
if(trilhas.length>0){body+=SPACER();body+=Pp("Trilhas de sangue",{bold:true,sz:20,spBef:120,spAft:60,color:"1A1A2E"});trilhas.forEach((tr,ti)=>{body+=Pp(`Trilha ${ti+1}`,{bold:true,sz:19,spAft:60});const ind2=[];if(tr.pegadas==="Sim")ind2.push("Pegadas");if(tr.arrasto==="Sim")ind2.push("Arrasto");if(tr.maos==="Sim")ind2.push("Mãos");if(tr.satelite==="Sim")ind2.push("Gotas satélite");if(tr.diminuicao==="Sim")ind2.push("Diminuição progressiva");body+=TBL_Z([["Origem",tr.origem],tr.gps_origem?["GPS Início",tr.gps_origem]:null,["Destino",tr.destino],tr.gps_destino?["GPS Fim",tr.gps_destino]:null,["Comprimento",tr.comprimento?tr.comprimento+"m":""],["Padrão",tr.padrao],["Continuidade",tr.continuidade],["Direcionamento",tr.direcionamento],["Acúmulo qtd.",tr.acumulo_qtd],["Acúmulo vol.",tr.acumulo_vol],["Acúmulo local",tr.acumulo_local],ind2.length?["Indicadores",ind2.join(", ")]:null,["Diluição",tr.diluicao],["Interferência",tr.interferencia],tr.interferencia==="Sim"?["Obs interferência",tr.interferencia_obs]:null,["Observações",tr.obs]]);});}
edificacoes.forEach((e,ei)=>{if(e.tipo||e.nome){body+=SPACER();body+=Pp(`Edificação ${ei+1}${e.tipo?" — "+e.tipo:""}${e.nome?" ("+e.nome+")":""}`,{bold:true,sz:20,spBef:120,spAft:60,color:"1A1A2E"});body+=TBL_Z([["Tipo",e.tipo],["Descrição complementar",e.nome],["Material",e.material],["Andares",e.andares],["Cobertura",e.cobertura],["Estado",e.estado],["Perímetro/muro",e.muro],["Portão",e.portao],["Acesso",e.acesso],["Entradas",e.n_entradas],["Iluminação interna",e.ilum_int],["Câmeras",e.cameras],["Vizinhança",e.vizinhanca],e.comodos_list?.length?["Cômodos",e.comodos_list.join(", ")]:null,e.comodos_fato?.length?["Cômodos do fato",e.comodos_fato.join(", ")]:null,["Observações",e.obs]]);if(e.comodos_fato_det&&e.comodos_fato?.length){e.comodos_fato.forEach(cf=>{const det=(e.comodos_fato_det||{})[cf];if(det){const allM2=[...(det.mr||[]),...(det.mi||[]),...(det.ma||[]),...(det.mac||[]),...(det.me||[]),...(det.mo||[])];if(det.estado||allM2.length||det.obs_manchas||det.obs_comodo){body+=Pp(`📍 ${cf}`,{bold:true,sz:19,spBef:80,spAft:40,color:"1A1A2E"});body+=TBL_Z([["Estado",det.estado],allM2.length?["Manchas",allM2.join(", ")]:null,["Obs manchas",det.obs_manchas],["Obs cômodo",det.obs_comodo]]);}}});}}});
// 4.2 Do Veículo (se houver)
const veicsComData=veiculos.filter((_,vi)=>d[`v${vi}_tipo`]||d[`v${vi}_placa`]);
if(veicsComData.length>0){body+=H2_NUM("4.2","Do Veículo");veiculos.forEach((vei,vi)=>{const vx=`v${vi}_`;if(d[vx+"tipo"]||d[vx+"placa"]){if(veicsComData.length>1)body+=Pp(`Veículo ${vi+1}`,{bold:true,sz:22,spBef:140,spAft:80,color:"1A1A2E"});body+=TBL_Z([["Categoria",d[vx+"cat"]],["Tipo",d[vx+"tipo"]],["Cor",d[vx+"cor"]],["Placa",d[vx+"placa"]],["Ano",d[vx+"ano"]],["Chassi",d[vx+"chassi"]],["Hodômetro",d[vx+"km"]],["Estado",d[vx+"estado"]],["Motor",d[vx+"motor"]],["Portas travadas",d[vx+"portas"]],["Vidros íntegros",d[vx+"vidros"]],["Chave",d[vx+"chave"]],["Observações",d[vx+"obs"]]]);}});if(veiVest.length){body+=SPACER();body+=Pp("Vestígios veiculares",{bold:true,sz:22,spBef:140,spAft:80,color:"1A1A2E"});let vvR="";veiVest.forEach((v,i)=>{const vi3=v.veiculo??0;const vx3="v"+vi3+"_";const tm3=d[vx3+"tipo"]||"";const vl3=veiculos[vi3]?.label||"Veículo";const sup3=`${vl3}${tm3?" ("+tm3+")":""} — ${v.regionLabel}`;const fill=(i%2===0)?"F5F5F7":"FFFFFF";vvR+=`<w:tr><w:tc><w:tcPr><w:tcW w:w="800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E8E8EC"/></w:tcPr>${Pp(String(i+1),{sz:20,center:true,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="5600" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp((v.tipo||v.regionLabel)+(v.obs?" — "+v.obs:""),{sz:20,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="3600" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(sup3,{sz:20,spAft:0})}
</w:tc></w:tr>`;});body+=`<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="10000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:left w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:right w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E6"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E0E0E6"/></w:tblBorders></w:tblPr>${vvR}</w:tbl>`;}}
// 4.3 Do Cadáver
const veicSuffix=veicsComData.length>0?"4.3":"4.2";
const subCadBase=veicSuffix;
cadaveres.forEach((cad,ci)=>{const cx=`c${ci}_`;const woundsC=wounds.filter(w=>w.cadaver===ci);const hasCad=d[cx+"fx"]||d[cx+"et"]||d[cx+"sx"]||woundsC.length>0||d[cx+"dg"];if(hasCad){if(cadaveres.length>1){body+=H2_NUM(subCadBase,`Do Cadáver ${ci+1}`);}else if(ci===0){body+=H2_NUM(subCadBase,"Do Cadáver");}
// 4.3.1 Descrição
body+=H3_NUM(`${subCadBase}.1`,"Descrição");
const descParts=[];
if(d[cx+"fx"])descParts.push(`faixa etária ${d[cx+"fx"].toLowerCase()}`);
if(d[cx+"et"])descParts.push(`etnia ${d[cx+"et"].toLowerCase()}`);
if(d[cx+"sx"])descParts.push(`sexo ${d[cx+"sx"].toLowerCase()}`);
if(d[cx+"cp"])descParts.push(`compleição ${d[cx+"cp"].toLowerCase()}`);
if(descParts.length)body+=PARA(`Tratava-se de cadáver de indivíduo com ${descParts.join(", ")}.`);
if(d[cx+"pos"])body+=PARA(`Encontrava-se em ${d[cx+"pos"].toLowerCase()}.`);
body+=TBL_Z([["Faixa etária",d[cx+"fx"]],["Etnia",d[cx+"et"]],["Sexo",d[cx+"sx"]],["Compleição",d[cx+"cp"]],["Posição",d[cx+"pos"]],["Diagnóstico",d[cx+"dg"]],["Local do evento",d[cx+"le"]],["Instrumento",Array.isArray(d[cx+"ins"])?d[cx+"ins"].join(", "):d[cx+"ins"]],["Outro instrumento",d[cx+"ins_o"]],["Momento",d[cx+"mom"]]]);
// Sub-tipo de suicídio
if(d[cx+"sui_tipo"]){body+=Pp(`Meio de suicídio: ${d[cx+"sui_tipo"]}`,{bold:true,sz:22,spBef:140,spAft:80,color:"1A1A2E"});if(d[cx+"sui_tipo"]==="Forca"){body+=TBL_Z([["Cadáver na forca",d[cx+"forca_cad"]],["Suspensão",d[cx+"forca_susp"]],["Instrumento",d[cx+"forca_inst"]],["Ancoragem",d[cx+"forca_anc"]],["Alt. ancoragem",d[cx+"forca_alt_anc"]],["Alt. nó",d[cx+"forca_alt_no"]],["Alt. pescoço",d[cx+"forca_alt_pesc"]],["Caract. sulco",d[cx+"forca_sulco"]],["Demais achados",d[cx+"forca_achados"]],["Obs",d[cx+"forca_obs"]]]);}if(d[cx+"sui_tipo"]==="Arma de fogo"){body+=TBL_Z([["Arma no local",d[cx+"af_local"]],["Modelo",d[cx+"af_modelo"]],["Nº série",d[cx+"af_serie"]],["Calibre",d[cx+"af_calibre"]],["Sangue na arma",d[cx+"af_sangue"]],["Obs",d[cx+"af_obs"]]]);}if(d[cx+"sui_tipo"]==="Arma branca"){body+=TBL_Z([["Arma no local",d[cx+"ab_local"]],["Cabo",d[cx+"ab_cabo"]],["Lâmina",d[cx+"ab_lamina"]],["Sangue lâmina",d[cx+"ab_sangue"]],["Obs",d[cx+"ab_obs"]]]);}if(d[cx+"sui_tipo"]==="Projeção"){body+=TBL_Z([["Altura ao piso",d[cx+"proj_alt"]],["Local projeção",d[cx+"proj_local"]],["Alt. parapeito",d[cx+"proj_alt_parapeito"]],["Alt. obj. apoio",d[cx+"proj_alt_apoio"]],["Obs",d[cx+"proj_obs"]]]);}if(d[cx+"sui_tipo"]==="Medicamento"){const meds2=(d[cx+"meds"]||[]).filter(m=>m.nome);if(meds2.length){let mR="";meds2.forEach((m,mi)=>{mR+=ROW_Z(`Med. ${mi+1}`,`${m.nome}${m.vazios?" | Espaços vazios: "+m.vazios:""}${m.comprimidos?" | Comprimidos: "+m.comprimidos:""}${m.obs?" | "+m.obs:""}`,mi);});body+=`<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="10000" w:type="dxa"/></w:tblPr>${mR}</w:tbl>`;}}if(d[cx+"sui_tipo"]==="Outro"&&d[cx+"sui_outro_obs"])body+=TBL_Z([["Obs",d[cx+"sui_outro_obs"]]]);}
// 4.3.2 Vestes e Pertences — só se houver vestes ou pertences cadastrados
const vestesC=vestes.filter(v=>v.tipo&&(v.cadaver===undefined||v.cadaver===ci));
if(vestesC.length||d[cx+"pert"]){body+=H3_NUM(`${subCadBase}.2`,"Vestes e Pertences");if(vestesC.length){let vRx=`<w:tr><w:tc><w:tcPr><w:tcW w:w="700" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Nº",{bold:true,sz:18,center:true,spAft:0,color:"FFFFFF"})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Tipo",{bold:true,sz:18,spAft:0,color:"FFFFFF"})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="1300" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Cor",{bold:true,sz:18,spAft:0,color:"FFFFFF"})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="1800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Sujidades",{bold:true,sz:18,spAft:0,color:"FFFFFF"})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Sangue",{bold:true,sz:18,spAft:0,color:"FFFFFF"})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="2700" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Bolsos / Notas",{bold:true,sz:18,spAft:0,color:"FFFFFF"})}
</w:tc></w:tr>`;vestesC.forEach((v,vi)=>{const fill=(vi%2===0)?"F5F5F7":"FFFFFF";const bn=[v.bolsos&&"Bolsos: "+v.bolsos,v.notas].filter(Boolean).join(" — ");vRx+=`<w:tr><w:tc><w:tcPr><w:tcW w:w="700" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E8E8EC"/></w:tcPr>${Pp(String(vi+1),{sz:20,center:true,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(v.tipo||"",{sz:20,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="1300" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(v.cor||"",{sz:20,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="1800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(v.sujidades||"",{sz:20,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(v.sangue||"",{sz:20,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="2700" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(bn,{sz:20,spAft:0})}
</w:tc></w:tr>`;});body+=`<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="10000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:left w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:right w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E6"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E0E0E6"/></w:tblBorders></w:tblPr>${vRx}</w:tbl>`;}if(d[cx+"pert"])body+=TBL_Z([["Pertences",d[cx+"pert"]]]);}
// 4.3.3 Perinecroscopia
body+=H3_NUM(`${subCadBase}.3`,"Perinecroscopia");
if(woundsC.length){body+=Pp(`Foram observadas ${woundsC.length} lesão(ões):`,{sz:20,spAft:80});let lR=`<w:tr><w:tc><w:tcPr><w:tcW w:w="800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Nº",{bold:true,sz:18,center:true,spAft:0,color:"FFFFFF"})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Região",{bold:true,sz:18,spAft:0,color:"FFFFFF"})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Tipo",{bold:true,sz:18,spAft:0,color:"FFFFFF"})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Características",{bold:true,sz:18,spAft:0,color:"FFFFFF"})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Obs",{bold:true,sz:18,spAft:0,color:"FFFFFF"})}
</w:tc></w:tr>`;woundsC.forEach((w,wi)=>{const fill=(wi%2===0)?"F5F5F7":"FFFFFF";lR+=`<w:tr><w:tc><w:tcPr><w:tcW w:w="800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E8E8EC"/></w:tcPr>${Pp(String(wi+1),{sz:20,center:true,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(w.regionLabel||"",{sz:20,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(w.tipo||"",{sz:20,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(w.caract?.length?w.caract.join(", "):"",{sz:20,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(w.obs||"",{sz:20,spAft:0})}
</w:tc></w:tr>`;});body+=`<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="10000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:left w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:right w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E6"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E0E0E6"/></w:tblBorders></w:tblPr>${lR}</w:tbl>`;}
body+=Pp("Fenômenos cadavéricos:",{bold:true,sz:22,spBef:140,spAft:80,color:"1A1A2E"});
body+=TBL_Z([["Cianose ungueais",d[cx+"cu"]],["Cianose labial",d[cx+"cl"]],["Rigidez mandíbula",d[cx+"rm"]],["Rigidez sup.",d[cx+"rs"]],["Rigidez inf.",d[cx+"ri"]],["Livores",d[cx+"lv"]],["Pos. livores",d[cx+"lp"]],["Compatível",d[cx+"lc"]],["Secr. nasal",d[cx+"sn"]],["Secr. oral",d[cx+"so"]],["Peniana/vaginal",d[cx+"sg"]],["Anal",d[cx+"sa"]],["Mancha verde abd.",d[cx+"mva"]],["Obs fenômenos",d[cx+"obs_peri"]]]);
if(d[cx+"avancado_decomp"]){body+=Pp("Achados de decomposição avançada",{bold:true,sz:22,spBef:140,spAft:80,color:"A02020"});body+=TBL_Z([(d[cx+"dec_abio"]||[]).length?["Abióticos / transformação",(d[cx+"dec_abio"]||[]).join(", ")]:null,(d[cx+"dec_fauna"]||[]).length?["Fauna cadavérica",(d[cx+"dec_fauna"]||[]).join(", ")]:null,(d[cx+"dec_cons"]||[]).length?["Conservação alternativa",(d[cx+"dec_cons"]||[]).join(", ")]:null,(d[cx+"dec_amb"]||[]).length?["Achados ambientais",(d[cx+"dec_amb"]||[]).join(", ")]:null,d[cx+"dec_obs"]?["Observações",d[cx+"dec_obs"]]:null]);}
// v234: 4.3.4 Observações gerais (livres)
if(d[cx+"obs_geral"]){body+=H3_NUM(`${subCadBase}.4`,"Observações gerais");body+=PARA(d[cx+"obs_geral"]);}
// 4.3.4 Exames de Medicina Legal — removido (informação complementada em laudo cadavérico específico)
}});
// ──── 5 CADEIA DE CUSTÓDIA DE VESTÍGIOS ────
const allVestD=[...vestigios.filter(v=>v.desc),...canvasVest.filter(v=>v.desc).map(v=>({...v,desc:`[${v.placa}] ${v.desc}`}))];
const vestNaoRec=allVestD.filter(v=>v.recolhido!=="Sim");
const vestRecIC=allVestD.filter(v=>v.recolhido==="Sim"&&!(v.destino||"").includes("II"));
const vestRecII=allVestD.filter(v=>v.recolhido==="Sim"&&(v.destino||"").includes("II"));
const mkVeiSupD=(vv)=>{const vi2=vv.veiculo??0;const vx2="v"+vi2+"_";const tm=d[vx2+"tipo"]||"";const vl=veiculos[vi2]?.label||"Veículo";return `${vl}${tm?" ("+tm+")":""} — ${vv.regionLabel}`;};
const veiVestICD=veiVest.filter(vv=>vv.recolhido==="Sim"&&(vv.destino||"").includes("IC")).map(vv=>({desc:vv.tipo||vv.regionLabel,suporte:mkVeiSupD(vv),obs:vv.obs}));
const veiVestIID=veiVest.filter(vv=>vv.recolhido==="Sim"&&(vv.destino||"").includes("II")).map(vv=>({desc:vv.tipo||vv.regionLabel,local:mkVeiSupD(vv)}));
const allVestRecICD=[...vestRecIC,...veiVestICD];
if(vestNaoRec.length||allVestRecICD.length||vestRecII.length||veiVestIID.length||d.obs_v||d.obs_p){body+=H1_NUM("5","CADEIA DE CUSTÓDIA DE VESTÍGIOS");
body+=PARA("De modo a preservar o registro de todos os vestígios recolhidos por ocasião do exame de local, listam-se, a seguir, os elementos materiais coletados, acompanhados dos respectivos suportes e locais de coleta.");
if(vestNaoRec.length){body+=Pp("Vestígios não recolhidos (documentados no local)",{bold:true,sz:22,spBef:200,spAft:80,color:"1A1A2E"});let vR="";vestNaoRec.forEach((v,i)=>{const fill=(i%2===0)?"F5F5F7":"FFFFFF";vR+=`<w:tr><w:tc><w:tcPr><w:tcW w:w="600" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E8E8EC"/></w:tcPr>${Pp(String(i+1),{sz:20,center:true,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="5800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(v.desc+(v.obs?" — "+v.obs:""),{sz:20,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="3600" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(supLoc(v),{sz:20,spAft:0})}
</w:tc></w:tr>`;});body+=`<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="10000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:left w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:right w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E6"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E0E0E6"/></w:tblBorders></w:tblPr><w:tr><w:tc><w:tcPr><w:tcW w:w="600" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Nº",{bold:true,sz:20,color:"FFFFFF",center:true,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="5800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Descrição",{bold:true,sz:20,color:"FFFFFF",spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="3600" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Suporte / Localização",{bold:true,sz:20,color:"FFFFFF",spAft:0})}
</w:tc></w:tr>${vR}</w:tbl>`;}
if(allVestRecICD.length){body+=Pp("Vestígios recolhidos — encaminhados ao Instituto de Criminalística",{bold:true,sz:22,spBef:200,spAft:80,color:"1A1A2E"});let vRC="";allVestRecICD.forEach((v,i)=>{const fill=(i%2===0)?"F5F5F7":"FFFFFF";vRC+=`<w:tr><w:tc><w:tcPr><w:tcW w:w="600" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E8E8EC"/></w:tcPr>${Pp(String(i+1),{sz:20,center:true,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="5800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(v.desc+(v.obs?" — "+v.obs:""),{sz:20,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="3600" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(supLoc(v),{sz:20,spAft:0})}
</w:tc></w:tr>`;});body+=`<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="10000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:left w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:right w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E6"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E0E0E6"/></w:tblBorders></w:tblPr><w:tr><w:tc><w:tcPr><w:tcW w:w="600" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Nº",{bold:true,sz:20,color:"FFFFFF",center:true,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="5800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Descrição",{bold:true,sz:20,color:"FFFFFF",spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="3600" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1A1A2E"/></w:tcPr>${Pp("Suporte / Localização",{bold:true,sz:20,color:"FFFFFF",spAft:0})}
</w:tc></w:tr>${vRC}</w:tbl>`;}
const papiloAll=[...vestRecII.map(v=>({desc:v.desc,local:supLoc(v)})),...veiVestIID,...papilos.filter(p=>p.desc)];
if(d.obs_v){body+=Pp("Observações sobre os vestígios: "+d.obs_v,{sz:20,spBef:120,spAft:80});}
if(papiloAll.length){body+=Pp("Vestígios recolhidos — encaminhados ao Instituto de Identificação (Papiloscopia)",{bold:true,sz:22,spBef:200,spAft:80,color:"1A1A2E"});let pR2="";papiloAll.forEach((p,i)=>{const fill=(i%2===0)?"F5F5F7":"FFFFFF";pR2+=`<w:tr><w:tc><w:tcPr><w:tcW w:w="600" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="E8E8EC"/></w:tcPr>${Pp(String(i+1),{sz:20,center:true,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="5800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(p.desc,{sz:20,spAft:0})}
</w:tc><w:tc><w:tcPr><w:tcW w:w="3600" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr>${Pp(supPlaca(p.local,p.placa),{sz:20,spAft:0})}
</w:tc></w:tr>`;});body+=`<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="10000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:left w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:right w:val="single" w:sz="4" w:space="0" w:color="C8D6E5"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E6"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E0E0E6"/></w:tblBorders></w:tblPr>${pR2}</w:tbl>`;}
if(d.obs_p)body+=Pp("Obs papiloscopia: "+d.obs_p,{sz:20,spBef:80});}
// ──── 6 EXAMES CORRELATOS — removida (incluída em laudos específicos anexos) ────
// ──── 7 ANÁLISE e 8 CONCLUSÃO — removidas (preenchidas manualmente pelos peritos no documento final)
// Encerramento
body+=SPACER(240);
const encPerito=perito2?`relatado pelo(a) Perito(a) Criminal ${perito1}${matP1?" (mat. "+matP1+")":""} e revisado pelo(a) Perito(a) Criminal ${perito2}${matP2?" (mat. "+matP2+")":""}`:`relatado pelo(a) Perito(a) Criminal ${perito1}${matP1?" (mat. "+matP1+")":""}`;
body+=PARA(`Nada mais havendo a lavrar, encerra-se o presente laudo, ${encPerito}, que segue assinado digitalmente.`);
// ──── FOTOGRAFIAS ────
let nextRid=10;const imgRels=[];
let ctXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>';
if(fotos&&fotos.length){body+=PAGE_BREAK();body+=H_CENTER("FOTOGRAFIAS");
fotos.forEach((f,i)=>{const rid="rId"+(nextRid++);const ext=f.dataUrl?.includes("png")?"png":"jpeg";const imgName=`foto_${i+1}.${ext}`;const b64=f.dataUrl?.split(",")?.[1];if(b64){const bin=atob(b64);const bytes=new Uint8Array(bin.length);for(let j=0;j<bin.length;j++)bytes[j]=bin.charCodeAt(j);zip.file("word/media/"+imgName,bytes);imgRels.push({rid,imgName});
const maxEmu=6000000;const ratio=Math.min(maxEmu/Math.max(f.w||800,1),maxEmu*0.75/Math.max(f.h||600,1));const cx=Math.round(Math.max(f.w||800,1)*ratio);const cy=Math.round(Math.max(f.h||600,1)*ratio);
body+=`<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:line="360" w:lineRule="auto"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${300+i}" name="Foto${i+1}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${300+i}" name="${imgName}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
const legendaDesc=f.desc||f.name||"";const legendaLocal=f.local||"";const showLocal=legendaLocal&&!legendaDesc.includes(legendaLocal);const legendaTxt=`Fotografia ${i+1}${legendaDesc?" — "+legendaDesc:""}${f.fase?" — "+f.fase:""}${showLocal?" — "+legendaLocal:""}`;body+=Pp(legendaTxt,{sz:20,center:true,italic:true,spAft:200,color:"555555"});}});}
// Croqui
if(imgRef.current){const allDrawKeys=Object.keys(imgRef.current).filter(k=>imgRef.current[k]);if(allDrawKeys.length>0){body+=PAGE_BREAK();body+=H_CENTER("CROQUI"+(allDrawKeys.length>1?"S":"")+" DO LOCAL");allDrawKeys.forEach((dk,di)=>{const curImg=imgRef.current[dk];if(!curImg)return;const rid="rId"+(nextRid++);const imgName=`croqui_${di+1}.jpeg`;const b64c=curImg.split(",")?.[1];if(b64c){const binC=atob(b64c);const bytesC=new Uint8Array(binC.length);for(let j=0;j<binC.length;j++)bytesC[j]=binC.charCodeAt(j);zip.file("word/media/"+imgName,bytesC);imgRels.push({rid,imgName});
// Proporção dinâmica: canvas é 1200x850 → 6000000 EMU largura → altura proporcional
const cwCx=6000000;const cwCy=Math.round(cwCx*850/1200);
body+=`<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${cwCx}" cy="${cwCy}"/><wp:docPr id="${900+di}" name="${imgName}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${900+di}" name="${imgName}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cwCx}" cy="${cwCy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
const lbl=desenhos[+dk]?desenhos[+dk].label:("Croqui "+(+dk+1));body+=Pp(`${lbl}`,{sz:20,center:true,italic:true,spAft:180});}});}}
// ═════════════ HEADER COM LOGOS ═════════════
// Embed logo images
const pcdfBytes=(()=>{const bin=atob(LOGO_PCDF_B64);const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return bytes;})();
const dfBytes=(()=>{const bin=atob(LOGO_DF_B64);const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return bytes;})();
zip.file("word/media/logo_pcdf.jpeg",pcdfBytes);
zip.file("word/media/logo_df.jpeg",dfBytes);
// Header image size: width 550000 EMU = ~60 pixels at native DPI
const imgPcdfEMU_cx=550000, imgPcdfEMU_cy=700000;
const imgDfEMU_cx=600000, imgDfEMU_cy=700000;
const header1Xml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
<w:tbl><w:tblPr><w:tblW w:w="10000" w:type="dxa"/><w:tblBorders><w:bottom w:val="single" w:sz="8" w:space="0" w:color="C9A961"/></w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid><w:gridCol w:w="1500"/><w:gridCol w:w="7000"/><w:gridCol w:w="1500"/></w:tblGrid>
<w:tr><w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${imgPcdfEMU_cx}" cy="${imgPcdfEMU_cy}"/><wp:docPr id="1001" name="Logo PCDF"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="1001" name="logo_pcdf.jpeg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogoPcdf"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${imgPcdfEMU_cx}" cy="${imgPcdfEMU_cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>
</w:tc><w:tc><w:tcPr><w:tcW w:w="7000" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="14"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t>POLÍCIA CIVIL DO DISTRITO FEDERAL</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="14"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t>DEPARTAMENTO DE POLÍCIA TÉCNICA</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="14"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t>INSTITUTO DE CRIMINALÍSTICA</w:t></w:r></w:p>
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="14"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t>SEÇÃO DE CRIMES CONTRA A PESSOA</w:t></w:r></w:p>
</w:tc><w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>
<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${imgDfEMU_cx}" cy="${imgDfEMU_cy}"/><wp:docPr id="1002" name="Logo DF"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="1002" name="logo_df.jpeg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogoDf"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${imgDfEMU_cx}" cy="${imgDfEMU_cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>
</w:tc></w:tr></w:tbl>
<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr></w:p>
</w:hdr>`;
zip.file("word/header1.xml",header1Xml);
zip.file("word/_rels/header1.xml.rels",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdLogoPcdf" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo_pcdf.jpeg"/><Relationship Id="rIdLogoDf" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo_df.jpeg"/></Relationships>`);
// ═════════════ FOOTER WITH PAGINATION ═════════════
const footer1Xml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:p><w:pPr><w:pBdr><w:top w:val="single" w:sz="4" w:space="1" w:color="C9A961"/></w:pBdr><w:tabs><w:tab w:val="center" w:pos="4680"/><w:tab w:val="right" w:pos="9360"/></w:tabs><w:spacing w:before="60" w:after="0"/></w:pPr>
<w:r><w:rPr><w:sz w:val="16"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="666666"/></w:rPr><w:t xml:space="preserve">Croqui de Levantamento de Local — Oc. ${oc}/${ano} — ${dp}ª DP</w:t></w:r>
<w:r><w:tab/></w:r>
<w:r><w:rPr><w:sz w:val="16"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="666666"/></w:rPr><w:t xml:space="preserve">pág. </w:t></w:r>
<w:r><w:rPr><w:sz w:val="16"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="666666"/></w:rPr><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r>
<w:r><w:rPr><w:sz w:val="16"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="666666"/></w:rPr><w:instrText xml:space="preserve"> PAGE \\* MERGEFORMAT </w:instrText></w:r>
<w:r><w:rPr><w:sz w:val="16"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="666666"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>
<w:r><w:rPr><w:sz w:val="16"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="666666"/></w:rPr><w:t>1</w:t></w:r>
<w:r><w:rPr><w:sz w:val="16"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="666666"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>
<w:r><w:rPr><w:sz w:val="16"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="666666"/></w:rPr><w:t xml:space="preserve"> de </w:t></w:r>
<w:r><w:rPr><w:sz w:val="16"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="666666"/></w:rPr><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r>
<w:r><w:rPr><w:sz w:val="16"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="666666"/></w:rPr><w:instrText xml:space="preserve"> NUMPAGES \\* MERGEFORMAT </w:instrText></w:r>
<w:r><w:rPr><w:sz w:val="16"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="666666"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>
<w:r><w:rPr><w:sz w:val="16"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="666666"/></w:rPr><w:t>1</w:t></w:r>
<w:r><w:rPr><w:sz w:val="16"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="666666"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>
<w:r><w:tab/></w:r>
<w:r><w:rPr><w:sz w:val="16"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="666666"/></w:rPr><w:t xml:space="preserve">SCPe/IC/DPT/PCDF</w:t></w:r>
</w:p>
</w:ftr>`;
zip.file("word/footer1.xml",footer1Xml);
// ═════════════ DOCUMENT.XML ═════════════
const docXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr><w:headerReference w:type="default" r:id="rIdHeader1"/><w:footerReference w:type="default" r:id="rIdFooter1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1700" w:right="1134" w:bottom="1200" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
// Rels
let relsXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>';
imgRels.forEach(r=>{relsXml+=`<Relationship Id="${r.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${r.imgName}"/>`;});
relsXml+='</Relationships>';
zip.file("[Content_Types].xml",ctXml);
zip.file("_rels/.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
zip.file("word/document.xml",docXml);
zip.file("word/_rels/document.xml.rels",relsXml);
/* v201: generateAsync sem mimeType (não é opção válida), download mais robusto p/ iOS */
const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});
if(returnBlobOnly)return blob;
/* v234: iOS Safari PWA standalone bloqueia <a download> com blob URL silenciosamente.
   Detecta e usa Web Share API direto nesse caso. */
const fileName=mkFileName("docx");
const isStandalonePWA=(typeof navigator!=="undefined"&&navigator.standalone===true)||(typeof window!=="undefined"&&window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches);
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream;
if(isStandalonePWA&&isIOS&&navigator.canShare){
  // PWA iOS: usa share sheet (Files.app, AirDrop, etc)
  try{
    const file=new File([blob],fileName,{type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
    if(navigator.canShare({files:[file]})){
      await navigator.share({files:[file],title:`Xandroid — Oc. ${data.oc||"___"}/${(data.oc_ano||"").slice(-2)}`,text:`Croqui DOCX — Ocorrência ${data.oc||"___"}/${data.oc_ano||""}`});
      showToast("✅ Compartilhado! Use 'Salvar em Arquivos' para salvar.");
      return;
    }
  }catch(e){
    if(e.name==="AbortError"){showToast("Cancelado");return;}
    console.warn("Share fallback falhou, tentando download:",e);
  }
}
// Fluxo padrão (browser comum, Android, desktop, navegador iOS não-standalone)
const url=URL.createObjectURL(blob);
const a=document.createElement("a");a.href=url;a.download=fileName;a.rel="noopener";
document.body.appendChild(a);a.click();document.body.removeChild(a);
setTimeout(()=>{try{URL.revokeObjectURL(url);}catch(e){/* noop */}},10000);
showToast("✅ Laudo gerado!");
}catch(e){
  const msg=e?.message||String(e)||"erro desconhecido";
  console.error("DOCX error:",e);
  showToast("❌ Erro DOCX: "+msg);
  setTimeout(()=>showToast(""),6000);
  if(returnBlobOnly)throw e; /* propaga p/ exportAllZip lidar */
}
};
// v205: Compartilhar DOCX direto via Web Share API (WhatsApp, e-mail, AirDrop, etc)
// Gera o DOCX em memória e abre o sheet de compartilhamento nativo do iOS/Android.
const shareCroquiDocx=async()=>{
  try{
    forceSaveCanvas();
    haptic("medium");
    showToast("⏳ Preparando para compartilhar…");
    const docxBlob=await saveCroquiDocx(true);
    if(!docxBlob){showToast("❌ Falha ao gerar DOCX");return;}
    const fileName=mkFileName("docx");
    const file=new File([docxBlob],fileName,{type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      try{
        await navigator.share({
          files:[file],
          title:`Xandroid — Oc. ${data.oc||"___"}/${(data.oc_ano||"").slice(-2)}`,
          text:`Croqui DOCX — Ocorrência ${data.oc||"___"}/${data.oc_ano||""}`
        });
        showToast("✅ Compartilhado!");
      }catch(e){
        if(e.name==="AbortError"){showToast("Cancelado");return;}
        throw e;
      }
    }else{
      // Fallback: baixa o arquivo se share não disponível (desktop, browsers antigos)
      showToast("⚠️ Compartilhamento não disponível — baixando…");
      const url=URL.createObjectURL(docxBlob);
      const a=document.createElement("a");a.href=url;a.download=fileName;
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      setTimeout(()=>URL.revokeObjectURL(url),10000);
    }
  }catch(e){
    console.error("Share DOCX:",e);
    showToast("❌ Erro: "+(e?.message||"falha desconhecida"));
  }
};
// v234: Botão "Baixar DOCX" inteligente — em PWA standalone (iOS/Android),
// o <a download> falha silenciosamente (Safari standalone bloqueia navegação
// para blob URL). Detecta o ambiente e usa Web Share API automaticamente.
// Em desktop ou Safari não-standalone, mantém download direto.
const smartSaveDocx=async()=>{
  const isStandalone=(()=>{try{return window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;}catch(_){return false;}})();
  const canShareFiles=(()=>{try{return!!(navigator.canShare&&navigator.share);}catch(_){return false;}})();
  // PWA mobile com Web Share -> usa share (que dá opção de "Salvar em Arquivos")
  if(isStandalone&&canShareFiles){return shareCroquiDocx();}
  // Caso contrário: download direto via saveCroquiDocx
  return saveCroquiDocx();
};
// v239: aceita blob direto (preferido) OU blobUrl/dataUrl (legado).
// Em PWA standalone iOS usa Web Share API (oferece "Salvar em Arquivos"); fora disso, baixa direto.
const smartSavePdf=async(blobOrUrl,title)=>{
  if(!blobOrUrl){showToast("❌ PDF não disponível");return;}
  const fileName=mkFileName("pdf",title==="RRV"?"RRV":"Croqui");
  // Normaliza: se vier URL (string), busca pra obter o Blob.
  const blob=blobOrUrl instanceof Blob?blobOrUrl:await (await fetch(blobOrUrl)).blob();
  const isStandalone=(()=>{try{return window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;}catch(_){return false;}})();
  const canShareFiles=(()=>{try{return!!(navigator.canShare&&navigator.share);}catch(_){return false;}})();
  if(isStandalone&&canShareFiles){
    try{
      const file=new File([blob],fileName,{type:"application/pdf"});
      if(navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:`Xandroid — ${title||"PDF"}`,text:`${title||"PDF"} — Oc. ${data.oc||"___"}/${data.oc_ano||""}`});
        showToast("✅ Salvo!");
        return;
      }
    }catch(e){
      if(e.name==="AbortError"){showToast("Cancelado");return;}
      console.warn("Share PDF falhou, tentando download:",e);
    }
  }
  // Fallback: download direto via <a download>
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=fileName;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),8000);
  showToast("✅ PDF baixado!");
};
// Helper: gera blob PDF a partir de HTML (reusado por exportAllZip)
// v232: ID único pra evitar colisão se duas chamadas concorrerem.
// Timeout opcional (default 60s) — html2pdf pode travar em silêncio em iOS.
// v246: opts.fast=true reduz scale (2 → 1.4) — pra ZIP onde tempo importa mais que qualidade.
// v248: removidas as opções `removeContainer`, `letterRendering`, `imageTimeout`, `compress`
// que tinham introduzido na v246 e estavam causando falhas silenciosas no Croqui PDF
// dentro do ZIP (algumas versões do html2canvas/jsPDF não aceitam essas chaves e
// rejeitam a Promise sem mensagem clara). Voltei pra config conservadora que funcionava
// na v245, mantendo só o `scale` dinâmico.
const genPdfBlobFromHtml=async(html,title,timeoutMs,opts)=>{const fast=opts&&opts.fast;const tMs=timeoutMs||(fast?45000:60000);const scale=fast?1.4:2;const html2pdf=await loadH2P();
const uniqueId="pdf-export-tmp-"+Date.now()+"-"+Math.floor(Math.random()*100000);
const tempEl=document.createElement("div");tempEl.id=uniqueId;tempEl.style.cssText="position:fixed;top:-99999px;left:-99999px;width:800px;padding:24px 20px;color:#222;font-size:12px;line-height:1.5;background:#fff;font-family:-apple-system,Arial,sans-serif;";tempEl.innerHTML=html;document.body.appendChild(tempEl);try{
// respiro pro DOM renderizar antes do html2canvas começar (evita race em iOS)
await new Promise(r=>setTimeout(r,50));
const work=html2pdf().set({margin:[14,8,14,8],filename:mkFileName("pdf",title==="RRV"?"RRV":"Croqui"),image:{type:"jpeg",quality:fast?0.85:0.95},html2canvas:{scale,useCORS:true,logging:false},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"},pagebreak:{mode:["avoid-all","css","legacy"]}}).from(tempEl).toPdf().get("pdf");
const timer=new Promise((_,rej)=>setTimeout(()=>rej(new Error("Timeout "+(tMs/1000)+"s gerando "+title+" (html2pdf travou)")),tMs));
const pdfObj=await Promise.race([work,timer]);
const totalPages=pdfObj.internal.getNumberOfPages();const pageW=pdfObj.internal.pageSize.getWidth();const pageH=pdfObj.internal.pageSize.getHeight();for(let i=1;i<=totalPages;i++){pdfObj.setPage(i);pdfObj.setFontSize(7);pdfObj.setTextColor(150);pdfObj.text(`Oc.: ${data.oc||"___"}/${data.oc_ano||""} | DP: ${data.dp||""} | Perito: ${data.p1||"___"}`,pageW/2,8,{align:"center"});pdfObj.text(`Página ${i} de ${totalPages}`,pageW/2,pageH-5,{align:"center"});}return pdfObj.output("blob");}finally{try{document.body.removeChild(tempEl);}catch(e){}}};

// Helpers fflate: converter blob → Uint8Array e base64 → Uint8Array
const blobToU8=async(b)=>new Uint8Array(await b.arrayBuffer());
const b64ToU8=(b64)=>{const bin=atob(b64);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return arr;};
const fflateZipAsync=(files,opts)=>new Promise((resolve,reject)=>{fflateZip(files,opts,(err,data)=>err?reject(err):resolve(data));});
// v244: converte Uint8Array de uma foto JPEG em data URL (pra reconstruir o dataUrl
// no momento do import do ZIP). Usa chunks pra não estourar a stack em fotos grandes.
const u8ToB64=(u8)=>{let binary="";const chunkSize=8192;for(let i=0;i<u8.length;i+=chunkSize){binary+=String.fromCharCode.apply(null,u8.subarray(i,Math.min(i+chunkSize,u8.length)));}return btoa(binary);};
// v244: importa um arquivo ZIP do Xandroid e reconstrói o estado completo
// (com fotos referenciadas via _file). Throws se o ZIP for inválido ou não
// tiver backup.json reconhecível.
const importZipBackup=async(zipFile)=>{
  const buffer=new Uint8Array(await zipFile.arrayBuffer());
  let unzipped;
  try{unzipped=unzipSync(buffer);}catch(e){throw new Error("Arquivo .zip inválido ou corrompido");}
  // Achar o JSON do backup (qualquer .json com "Backup" no nome ou que tenha _v)
  const jsonKey=Object.keys(unzipped).find(k=>/Backup.*\.json$/i.test(k))||Object.keys(unzipped).find(k=>k.endsWith(".json"));
  if(!jsonKey)throw new Error("ZIP não tem backup.json — não é um pacote do Xandroid");
  let bd;
  try{bd=JSON.parse(strFromU8(unzipped[jsonKey]));}catch(e){throw new Error("backup.json corrompido");}
  // Reconstruir dataUrls das fotos a partir da pasta /fotos/ do próprio ZIP
  if(Array.isArray(bd.fotos)&&bd.fotos.length>0){
    bd.fotos=bd.fotos.map(f=>{
      // Se já tem dataUrl (formato antigo), só passa adiante
      if(f.dataUrl)return f;
      // Se tem _file, lê do ZIP e reconstrói
      if(f._file&&unzipped[f._file]){
        try{const u8=unzipped[f._file];const b64=u8ToB64(u8);const{_file,...rest}=f;return{...rest,dataUrl:`data:image/jpeg;base64,${b64}`};}
        catch(e){console.warn("Falha ao reconstruir foto",f._file,e);return f;}
      }
      return f;// foto sem dataUrl nem _file (raro) — devolve como veio
    });
  }
  return bd;
};
// v244: helper unificado de importação — detecta .json ou .zip pelo nome do
// arquivo e dispara o caminho certo. Usado em 2 lugares (botão "Importar"
// da aba Exportar e botão "Importar backup" do start menu).
const doImportBackupFile=async(file,onDone)=>{
  if(!file)return;
  const isZip=/\.zip$/i.test(file.name);
  try{
    let bd;
    if(isZip){showToast("⏳ Lendo ZIP… aguarde");bd=await importZipBackup(file);}
    else{const text=await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=e=>res(e.target.result);fr.onerror=()=>rej(new Error("Falha leitura"));fr.readAsText(file);});bd=JSON.parse(text);}
    applyBackupData({...bd,data:bd.dados||bd.data});
    const photoCount=Array.isArray(bd.fotos)?bd.fotos.length:0;
    showToast(`✅ Backup importado${isZip?` (ZIP${photoCount?` · ${photoCount} foto${photoCount>1?"s":""}`:""})`:""}`);
    haptic("heavy");
    if(onDone)onDone(bd);
  }catch(err){
    console.error("CQ import:",err);
    showToast("❌ "+(err.message||"Erro ao importar").slice(0,60));
    haptic("warning");
  }
};
// Exportar TUDO em ZIP + Web Share API
// v238: migrado de JSZip para fflate (~2x mais rápido, bundle menor).
// fflate não tem callback de progresso na compactação — em troca a etapa
// é tão rápida que não precisa.
const exportAllZip=async(useShare=false)=>{
// v247/v248: cancela timeout de "limpar progress após 3s" da CHAMADA ANTERIOR.
if(zipProgressTimerRef.current){clearTimeout(zipProgressTimerRef.current);zipProgressTimerRef.current=null;}
// v248: RESET DEFENSIVO — se exportingZipRef ficou preso por mais de 6 minutos
// (tempo máximo realista de uma geração mesmo grande), considera que a chamada
// anterior morreu silenciosamente e libera o lock. Resolve o bug "botões parados
// após primeira geração" mesmo que algum erro silencioso tenha pulado o finally.
const stuckMs=zipStartedAtRef.current?Date.now()-zipStartedAtRef.current:0;
if(exportingZipRef.current&&stuckMs>360000){console.warn("[ZIP] reset defensivo — lock preso há",Math.round(stuckMs/1000),"s");exportingZipRef.current=false;setZipProgress(null);}
if(exportingZipRef.current){showToast("⏳ Já está gerando — aguarde");haptic("warning");return;}
zipStartedAtRef.current=Date.now();
// v245: aviso pré-ZIP quando há muitas fotos (250+) — alerta o usuário sobre
// tempo e risco de OOM em iPhone com pouca RAM
const photoCount=fotos?.length||0;
if(photoCount>=250){const estTotMB=fotos.reduce((s,f)=>s+(f.sizeKB||0),0)/1024;const estMin=Math.max(1,Math.round(photoCount/180));const ok=await confirmAsync(`Pacote ZIP com ${photoCount} fotos`,`Volume estimado: ${estTotMB.toFixed(0)} MB.\nTempo estimado: ${estMin} a ${estMin*2} minuto${estMin>1?"s":""}.\n\nDuração varia conforme o celular. Em iPhone antigo pode falhar por memória.\n\nDicas:\n• Mantenha o app aberto até o banner verde\n• Se travar, prefira "Baixar JSON" + fotos manualmente\n\nContinuar?`,{okLabel:"Continuar",okIcon:"📦",danger:false,cancelLabel:"Cancelar"});if(!ok){haptic("selection");return;}}
exportingZipRef.current=true;zipCancelRef.current=false;let stage="iniciando";const failures=[];const startTime=Date.now();const checkCancel=()=>{if(zipCancelRef.current)throw new Error("Cancelado pelo usuário");};const upd=(pct,st,detail)=>{stage=st;setZipProgress({pct,stage:st,detail:detail||"",startTime});checkCancel();};try{upd(2,"Preparando","Salvando canvas…");forceSaveCanvas();haptic("medium");const d=data;const oc=d.oc||"___";const ano=d.oc_ano||"____";const dp=d.dp==="Outro"?(d.dp_outro||"___"):(d.dp||"___");const baseName=`Xandroid_${oc}-${ano}_DP${dp}`.replace(/[^a-zA-Z0-9_-]/g,"_");
// files: dicionário { "caminho/arquivo.ext": Uint8Array  ou  [Uint8Array, opts] }
const files={};
// 1) PDF Croqui (tolerante a falha) — timeout 45s pra cobrir cenários grandes
upd(15,"Gerando Croqui PDF","Renderizando (modo rápido)…");try{const croquiBlob=await genPdfBlobFromHtml(bPDF(),"Croqui",45000,{fast:true});files[mkFileName("pdf","Croqui")]=await blobToU8(croquiBlob);}catch(e){const msg=String(e&&e.message||e||"desconhecido").slice(0,80);console.error("[ZIP] Croqui PDF falhou:",e);try{if(typeof window!=="undefined"&&window.__xandroidErrors)window.__xandroidErrors.unshift({t:new Date().toISOString(),type:"zip-croqui-fail",msg,stack:String(e&&e.stack||"").slice(0,1500),extra:""});}catch(_){}failures.push(`Croqui (${msg})`);}
// 2) RRV NÃO é mais incluído no ZIP (v247)
//    Motivo: RRV requer assinatura do papiloscopista, geralmente feita em
//    momento separado. Incluir antes do RRV ser válido confunde a cadeia
//    documental. Use o botão "RRV PDF" individual quando o papiloscopista
//    estiver disponível pra assinar.
// 3) DOCX (tolerante a falha) — timeout maior pra montagem grande
upd(50,"Gerando DOCX","Montando documento Word…");try{const docxPromise=saveCroquiDocx(true);const docxTimer=new Promise((_,rej)=>setTimeout(()=>rej(new Error("Timeout 60s no DOCX")),60000));const docxBlob=await Promise.race([docxPromise,docxTimer]);if(docxBlob)files[mkFileName("docx")]=await blobToU8(docxBlob);}catch(e){const msg=String(e&&e.message||e||"desconhecido").slice(0,80);console.warn("[ZIP] DOCX falhou:",e);try{if(typeof window!=="undefined"&&window.__xandroidErrors)window.__xandroidErrors.unshift({t:new Date().toISOString(),type:"zip-docx-fail",msg,stack:String(e&&e.stack||"").slice(0,1500),extra:""});}catch(_){}failures.push(`DOCX (${msg})`);}
// 4) Fotos individuais — STORE (level 0, sem re-comprimir JPEG)
// v244: agora geradas ANTES do JSON pra que o JSON possa apenas REFERENCIAR
// os arquivos da pasta /fotos/ (em vez de incluir base64 das mesmas fotos).
// Resultado: ZIP 30-50% menor + JSON.stringify muito mais rápido.
const fotosLite=[];// cópia das fotos sem dataUrl, com _file apontando pro arquivo
if(fotos&&fotos.length>0){upd(70,"Adicionando fotos",`${fotos.length} foto(s)…`);const tabToCat={[TAB_SOLICITACAO]:"solicitacao",[TAB_LOCAL]:"local",[TAB_VESTIGIOS]:"vestigios",[TAB_CADAVER]:"cadaver",[TAB_VEICULO]:"veiculo"};const faseToShort={"Antes da perícia":"antes","Durante a perícia":"durante","Após a perícia":"apos"};const sanit=(s)=>String(s||"").replace(/[^a-zA-Z0-9_-]/g,"_").slice(0,40);for(let i=0;i<fotos.length;i++){const f=fotos[i];if(!f.dataUrl){fotosLite.push(f);continue;}try{const m=f.dataUrl.match(/^data:image\/[a-z]+;base64,(.+)$/);if(!m){fotosLite.push(f);continue;}const seq=String(i+1).padStart(3,"0");const cat=tabToCat[fotoTab(f.ref)]||"outros";const fase=faseToShort[f.fase]||"sem_fase";const refSan=sanit(f.ref||"foto");const localShort=sanit(f.local||"");const descShort=sanit((f.desc||"").slice(0,30));const ctx=localShort||descShort;const nameParts=[seq,cat,fase,refSan,ctx].filter(Boolean);const safeName="fotos/"+nameParts.join("_")+".jpg";files[safeName]=[b64ToU8(m[1]),{level:0}];// foto JPEG sem recompressão
// versão "lite" da foto pro JSON: tudo MENOS dataUrl, com _file apontando pro arquivo
const{dataUrl,...meta}=f;fotosLite.push({...meta,_file:safeName});
if(i%5===0)upd(70+Math.round((i/fotos.length)*15),"Adicionando fotos",`${i+1}/${fotos.length}`);}catch(e){console.warn("Foto skip:",e);fotosLite.push(f);}}}else{/* nenhuma foto */}
// 5) JSON Backup — agora SEM fotos em base64 (referencia /fotos/* via _file)
// Quando reimportado o ZIP, o app reconstrói os dataUrl em memória a partir
// dos arquivos da pasta. Backup standalone (botão "Baixar JSON") continua
// embutindo as fotos completas pra ser auto-suficiente.
upd(86,"Backup JSON","Empacotando dados…");const backupObj={_v:APP_VERSION,_format:"zip",dados:data,vestigios,canvasVest,vestes,papilos,wounds,edificacoes,veiVest,trilhas,cadaveres,veiculos,desenho:imgRef.current,desenhos,stampObjs,fotos:fotosLite,ppm,perito:loginName,matricula:loginMat,timestamp:new Date().toISOString()};files[mkFileName("json","Backup")]=strToU8(JSON.stringify(backupObj,null,2));
// 6) README
upd(88,"Finalizando","Gerando documentação…");const failuresNote=failures.length?`\n\n⚠️ Parcial — falharam: ${failures.join(", ")}. Use os botões individuais para tentar de novo cada um.`:"";const readme=`Xandroid — Pacote de exportação\n${"=".repeat(40)}\n\nOcorrência: ${oc}/${ano}\nDP: ${dp}\nPerito: ${loginName||"___"} (mat. ${loginMat})\nGerado em: ${fmtDt(new Date())}\nVersão app: ${APP_VERSION}${failuresNote}\n\nConteúdo:\n- ${mkFileName("pdf","Croqui")} — Croqui de Levantamento\n- ${mkFileName("docx")} — Laudo DOCX (editável)\n- ${mkFileName("json","Backup")} — Backup (referencia /fotos/ — importe o ZIP inteiro)\n${fotos.length>0?`- /fotos/ — ${fotos.length} foto(s) JPEG em resolução máxima (sem re-compressão)\n  Nome: <seq>_<categoria>_<fase>_<ref>_<descrição>.jpg`:""}\n\n⚠️ RRV (Registro de Recolhimento de Vestígios) NÃO está incluído neste pacote.\n   Motivo: o RRV requer assinatura do papiloscopista responsável.\n   Para gerar o RRV, use o botão "RRV PDF" individual na aba Exportar\n   no momento em que o papiloscopista puder assinar o documento.\n\nCOMO IMPORTAR DE VOLTA:\n  Abra o Xandroid → "Importar backup" → selecione este arquivo .zip\n  As fotos serão reconectadas aos respectivos campos do croqui.\n`;files["LEIA-ME.txt"]=strToU8(readme);
// Gerar ZIP final via fflate — sem callback de progresso, mas é rápido
upd(90,"Compactando","Comprimindo arquivos…");const zipU8=await fflateZipAsync(files,{level:6});const zipBlob=new Blob([zipU8],{type:"application/zip"});const zipName=`${baseName}_${new Date().toISOString().slice(0,10).replace(/-/g,"")}.zip`;
// Web Share API
if(useShare){upd(96,"Compartilhando","Abrindo opções…");try{const file=new File([zipBlob],zipName,{type:"application/zip"});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:`Xandroid ${oc}/${ano}`,text:`Documentação forense — Ocorrência ${oc}/${ano}`});upd(100,"Concluído",failures.length?`Parcial — falhou: ${failures.join(", ")}`:"Compartilhado!");showToast(failures.length?`⚠️ Compartilhado parcial — falhou: ${failures.join(", ")}`:"✅ Compartilhado!");return;}else{showToast("⚠️ Compartilhamento não disponível, baixando…");}}catch(e){if(e.name==="AbortError"){upd(100,"Cancelado","");showToast("Compartilhamento cancelado");return;}console.warn("Share falhou:",e);showToast("⚠️ Falhou — baixando arquivo");}}
// Fallback: download
upd(98,"Baixando","Iniciando download…");const url=URL.createObjectURL(zipBlob);const a=document.createElement("a");a.href=url;a.download=zipName;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(url),8000);upd(100,"Concluído",`${(zipBlob.size/1024/1024).toFixed(1)} MB`);showToast(failures.length?`⚠️ ZIP gerado parcial (faltou: ${failures.join(", ")})`:`✅ ZIP gerado (${(zipBlob.size/1024/1024).toFixed(1)} MB)`);haptic(failures.length?"warning":"success");}catch(e){const msg=e&&e.message?e.message:String(e);if(msg==="Cancelado pelo usuário"){setZipProgress({pct:0,stage:"Cancelado",detail:"Geração interrompida",startTime});showToast("⚠️ Geração cancelada");haptic("warning");}else{console.error("[ZIP] Erro fatal no estágio '"+stage+"':",e);console.error("[ZIP] Stack:",e&&e.stack);setZipProgress({pct:0,stage:"❌ Erro em "+stage,detail:msg.slice(0,80),error:true,startTime});showToast("❌ "+stage+": "+msg.slice(0,60));haptic("error");}}finally{exportingZipRef.current=false;zipCancelRef.current=false;
// v247: limpa progress modal após 3s, mas guarda o handle pra cancelar caso
// uma nova geração comece nesse intervalo (evitava o bug "depois do primeiro
// ZIP os botões param de funcionar" — na verdade o progress da segunda
// chamada era zerado pelo timeout da primeira)
if(zipProgressTimerRef.current)clearTimeout(zipProgressTimerRef.current);
zipProgressTimerRef.current=setTimeout(()=>{setZipProgress(null);zipProgressTimerRef.current=null;},3000);}};

const copyHTML=(html,title)=>{const full=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${pCSS}</style></head><body>${html}</body></html>`;const fb=(t2)=>{const ta=document.createElement("textarea");ta.value=t2;ta.style.cssText="position:fixed;left:-9999px;top:0;opacity:0";document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand("copy");setCopyOk("HTML copiado!");}catch(e2){setCopyOk("Erro ao copiar.");}document.body.removeChild(ta);setTimeout(()=>setCopyOk(""),5000);};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(full).then(()=>{setCopyOk("HTML copiado!");setTimeout(()=>setCopyOk(""),5000);}).catch(()=>fb(full));}else{fb(full);}};
  // ──────────────────────────────────────────
  // EXPORTAÇÃO — Resumo texto (sum)
  // Gera texto resumido de todos os dados
  // Usado pelo export texto/JSON
  // ──────────────────────────────────────────
const sum=()=>{const d=data;const ln=(l,v)=>v?(Array.isArray(v)?v.length?`${l}: ${v.join(", ")}\n`:"":v?`${l}: ${v}\n`:""):"";let r="━━━ 1. HISTÓRICO / SOLICITAÇÃO ━━━\n"+ln("Oc.",d.oc)+ln("Ano",d.oc_ano)+ln("DP",d.dp==="Outro"?(d.dp_outro||""):d.dp)+ln("Natureza",d.nat==="Outros"?(d.nat_outro||""):d.nat)+ln("Exame Externo",d.oic)+ln("Solicitação",d.dt_sol)+ln("Perito",d.p1?d.p1+(d.mat_p1?" (mat. "+d.mat_p1+")":""):"")+ln("2º Perito",d.p2?d.p2+(d.mat_p2?" (mat. "+d.mat_p2+")":""):"")+ln("Agente",d.ag==="Outro"?(d.ag_outro||""):d.ag)+ln("Papilo",d.pp==="Outro"?(d.pp_outro||""):d.pp)+ln("Mat. Papilo",d.mat_pp)+ln("Viatura",d.vt==="Outra"?(d.vt_outro||""):d.vt)+ln("Obs solicitação",d.obs_sol);r+="\n━━━ 2. ATENDIMENTO ━━━\n"+ln("Deslocamento",d.dt_des)+ln("Chegada",d.dt_che)+ln("Término",d.dt_ter);r+="\n━━━ 2.1 RECURSOS EMPREGADOS ━━━\n"+ln("Drone",d.drone)+ln("Scanner",d.scanner)+ln("Luminol",d.luminol)+ln("Luz forense",d.luz_forense);r+="\n━━━ 3. ISOLAMENTO DO LOCAL E PRESENÇA DE AGENTE ESTATAL ━━━\n"+ln("Isolamento",d.iso)+ln("Preservação",d.pres)+ln("Responsável",d.rp)+ln("Matrícula",d.mt)+ln("Órgão",d.org)+ln("Viatura isol.",d.vr)+ln("Obs",d.obs_i);r+="\n━━━ 4.1 DO LOCAL ━━━\n"+ln("Endereço",d.end)+ln("GPS",d.gps)+ln("Área",d.area)+ln("Destinação",d.dest)+ln("Tipo",tpStr(d.tp))+ln("Via",d.via)+ln("Iluminação",d.ilu)+ln("Ligada",d.ilul);if(tpHas(d.tp,"Via pública")){r+="\n━━━ 4.1.1 VIA PÚBLICA ━━━\n"+ln("Pavimento",d.vp_pav)+ln("Faixas",d.vp_faixas)+ln("Mão",d.vp_mao)+ln("Canteiro central",d.vp_canteiro)+(d.vp_canteiro==="Sim"?ln("Tipo canteiro",d.vp_canteiro_tipo):"")+ln("Meio-fio",d.vp_meiofio)+ln("Calçada",d.vp_calcada)+ln("Trânsito",d.vp_transito)+ln("Frenagem",d.vp_frenagem)+(d.vp_frenagem==="Sim"?ln("Comp. frenagem",d.vp_frenagem_comp):"")+ln("Derrapagem",d.vp_derrapagem)+ln("Debris",d.vp_debris)+(d.vp_debris==="Sim"?ln("Obs debris",d.vp_debris_obs):"")+ln("Obs características",d.vp_obs_caract)+ln("Obs condições",d.vp_obs_cond);const vpM=[...(d.vp_mr||[]),...(d.vp_mi||[]),...(d.vp_ma||[]),...(d.vp_mac||[]),...(d.vp_me||[]),...(d.vp_mo||[])];if(vpM.length)r+=ln("Manchas sangue via",vpM.join(", "));r+=ln("Obs manchas via",d.vp_obs_manchas);}if(d.dest==="Área verde"&&(d.av_veg||d.av_obs)){r+="\n━━━ 4.1.2 ÁREA VERDE ━━━\n"+ln("Vegetação",d.av_veg)+ln("Obs área verde",d.av_obs);}if(trilhas.length>0){r+="\n━━━ 4.1.3 TRILHAS DE SANGUE ━━━\n";trilhas.forEach((tr,ti)=>{r+=`  Trilha ${ti+1}:${tr.origem?" Origem: "+tr.origem:""}${tr.destino?" → Destino: "+tr.destino:""}${tr.comprimento?" | Comprimento: "+tr.comprimento+"m":""}${tr.padrao?" | Padrão: "+tr.padrao:""}${tr.continuidade?" | "+tr.continuidade:""}\n`;r+=`${tr.direcionamento?"    Direcionamento: "+tr.direcionamento+"\n":""}`;if(tr.acumulo_qtd)r+=`    Acúmulo: ${tr.acumulo_qtd}x ${tr.acumulo_vol||""} — ${tr.acumulo_local||""}\n`;const ind=[];if(tr.pegadas==="Sim")ind.push("Pegadas");if(tr.arrasto==="Sim")ind.push("Arrasto");if(tr.maos==="Sim")ind.push("Mãos");if(tr.satelite==="Sim")ind.push("Gotas satélite");if(tr.diminuicao==="Sim")ind.push("Diminuição progressiva");if(ind.length)r+=`    Indicadores: ${ind.join(", ")}\n`;if(tr.diluicao==="Sim")r+=`    Diluição: Sim\n`;if(tr.interferencia==="Sim")r+=`    Interferência: ${tr.interferencia_obs||"Sim"}\n`;if(tr.obs)r+=`    Obs: ${tr.obs}\n`;});}if(edificacoes.some(e=>e.tipo||e.nome)){r+="\n━━━ 4.1.4 EDIFICAÇÕES ━━━\n";edificacoes.forEach((e,ei)=>{if(e.tipo||e.nome){r+=`  Edificação ${ei+1}:${e.tipo?" "+e.tipo:""}${e.nome?" ("+e.nome+")":""}${e.material?" | Material: "+e.material:""}${e.andares?" | Andares: "+e.andares:""}${e.cobertura?" | Cobertura: "+e.cobertura:""}${e.estado?" | Estado: "+e.estado:""}\n`;r+=`${e.muro||e.portao||e.acesso||e.n_entradas?"    ":""}${e.muro?"Perímetro: "+e.muro:""}${e.portao?" | Portão: "+e.portao:""}${e.acesso?" | Acesso: "+e.acesso:""}${e.n_entradas?" | Entradas: "+e.n_entradas:""}${e.muro||e.portao||e.acesso||e.n_entradas?"\n":""}`;r+=`${e.ilum_int||e.cameras?"    ":""}${e.ilum_int?"Iluminação interna: "+e.ilum_int:""}${e.cameras?" | Câmeras: "+e.cameras:""}${e.ilum_int||e.cameras?"\n":""}`;r+=`${e.vizinhanca?"    Vizinhança: "+e.vizinhanca+"\n":""}`;if(e.comodos_list&&e.comodos_list.length)r+=`    Cômodos: ${e.comodos_list.join(", ")}\n`;if(e.comodos_fato&&e.comodos_fato.length){r+=`    Cômodos do fato: ${e.comodos_fato.join(", ")}\n`;if(e.comodos_fato_det){e.comodos_fato.forEach(cf=>{const det=(e.comodos_fato_det||{})[cf];if(det){const allM=[...(det.mr||[]),...(det.mi||[]),...(det.ma||[]),...(det.mac||[]),...(det.me||[]),...(det.mo||[])];if(det.estado||allM.length)r+=`      📍 ${cf}: ${det.estado?"Estado: "+det.estado:""}${allM.length?" | Manchas: "+allM.join(", "):""}${det.obs_manchas?" | Obs: "+det.obs_manchas:""}${det.obs_comodo?" | Obs cômodo: "+det.obs_comodo:""}\n`;}});}}if(e.obs)r+=`    Obs: ${e.obs}\n`;}});}r+=ln("Obs local",d.obs_l);const allVS=[...vestigios.filter(v=>v.desc),...canvasVest.filter(v=>v.desc).map(v=>({...v,desc:`[${v.placa}] ${v.desc}`}))];const vsNR=allVS.filter(v=>v.recolhido!=="Sim");const vsRC=allVS.filter(v=>v.recolhido==="Sim"&&!(v.destino||"").includes("II"));const vsII=allVS.filter(v=>v.recolhido==="Sim"&&(v.destino||"").includes("II"));
if(vsNR.length){r+="\n━━━ 5.1 VESTÍGIOS (não recolhidos) ━━━\n";vsNR.forEach((v,i)=>r+=`  ${i+1}. ${v.desc} [${supLoc(v)}]${v.obs?" — "+v.obs:""}\n`);}
if(vsRC.length){r+="\n━━━ 5.2 VESTÍGIOS RECOLHIDOS ━━━\n";vsRC.forEach((v,i)=>r+=`  ${i+1}. ${v.desc} [${supLoc(v)}]${v.obs?" — "+v.obs:""}\n`);}
r+=ln("Obs vestígios",d.obs_v);cadaveres.forEach((cad,ci)=>{const cx2=`c${ci}_`;const woundsC=wounds.filter(w=>w.cadaver===ci);const hasCad=d[cx2+"fx"]||d[cx2+"et"]||d[cx2+"sx"]||woundsC.length>0||d[cx2+"dg"];if(hasCad){r+=`\n━━━ 4.3 DO CADÁVER${cadaveres.length>1?" "+(ci+1):""} ━━━\n`;r+=ln("Faixa",d[cx2+"fx"])+ln("Etnia",d[cx2+"et"])+ln("Sexo",d[cx2+"sx"])+ln("Compleição",d[cx2+"cp"])+ln("Posição",d[cx2+"pos"]);r+=ln("Diagnóstico",d[cx2+"dg"])+ln("Local evento",d[cx2+"le"])+ln("Instrumento",d[cx2+"ins"])+ln("Outro instr.",d[cx2+"ins_o"])+ln("Momento",d[cx2+"mom"]);if(d[cx2+"sui_tipo"]){r+=ln("Meio suicídio",d[cx2+"sui_tipo"]);if(d[cx2+"sui_tipo"]==="Forca"){r+=ln("Cadáver na forca",d[cx2+"forca_cad"])+ln("Suspensão",d[cx2+"forca_susp"])+ln("Instrumento",d[cx2+"forca_inst"])+ln("Ancoragem",d[cx2+"forca_anc"])+ln("Alt. ancoragem",d[cx2+"forca_alt_anc"])+ln("Alt. nó",d[cx2+"forca_alt_no"])+ln("Alt. pescoço",d[cx2+"forca_alt_pesc"])+ln("Caract. sulco",d[cx2+"forca_sulco"])+ln("Demais achados",d[cx2+"forca_achados"])+ln("Obs forca",d[cx2+"forca_obs"]);}if(d[cx2+"sui_tipo"]==="Arma de fogo"){r+=ln("AF no local",d[cx2+"af_local"])+ln("Modelo",d[cx2+"af_modelo"])+ln("Série",d[cx2+"af_serie"])+ln("Calibre",d[cx2+"af_calibre"])+ln("Sangue AF",d[cx2+"af_sangue"])+ln("Obs AF",d[cx2+"af_obs"]);}if(d[cx2+"sui_tipo"]==="Arma branca"){r+=ln("AB no local",d[cx2+"ab_local"])+ln("Cabo",d[cx2+"ab_cabo"])+ln("Lâmina",d[cx2+"ab_lamina"])+ln("Sangue AB",d[cx2+"ab_sangue"])+ln("Obs AB",d[cx2+"ab_obs"]);}if(d[cx2+"sui_tipo"]==="Projeção"){r+=ln("Altura",d[cx2+"proj_alt"])+ln("Local projeção",d[cx2+"proj_local"])+ln("Alt. parapeito",d[cx2+"proj_alt_parapeito"])+ln("Alt. obj. apoio",d[cx2+"proj_alt_apoio"])+ln("Obs projeção",d[cx2+"proj_obs"]);}if(d[cx2+"sui_tipo"]==="Medicamento"&&d[cx2+"meds"]){const meds2=d[cx2+"meds"].filter(m=>m.nome);if(meds2.length){r+="Medicamentos:\n";meds2.forEach((m,mi)=>r+=`  ${mi+1}. ${m.nome}${m.vazios?" | Espaços vazios: "+m.vazios:""}${m.comprimidos?" | Comprimidos: "+m.comprimidos:""}${m.obs?" | "+m.obs:""}\n`);}}if(d[cx2+"sui_tipo"]==="Outro")r+=ln("Obs",d[cx2+"sui_outro_obs"]);}if(woundsC.length){r+=`Lesões (${woundsC.length}):\n`;woundsC.forEach((w,wi)=>r+=`  ${wi+1}. ${w.regionLabel}${w.tipo?": "+w.tipo:""}${w.caract&&w.caract.length?" ["+w.caract.join(", ")+"]":""}${w.obs?" — "+w.obs:""}\n`);}r+=ln("Cianose ungueais",d[cx2+"cu"])+ln("Cianose labial",d[cx2+"cl"])+ln("Rigidez Mand.",d[cx2+"rm"])+ln("Rigidez Sup.",d[cx2+"rs"])+ln("Rigidez Inf.",d[cx2+"ri"])+ln("Livores",d[cx2+"lv"])+ln("Pos. livores",d[cx2+"lp"])+ln("Compatível",d[cx2+"lc"])+ln("Secr. nasal",d[cx2+"sn"])+ln("Secr. oral",d[cx2+"so"])+ln("Peniana/vaginal",d[cx2+"sg"])+ln("Anal",d[cx2+"sa"])+ln("Mancha verde abd.",d[cx2+"mva"])+ln("Obs fenômenos",d[cx2+"obs_peri"]);const vestesC=vestes.filter(v=>v.tipo&&(v.cadaver===undefined||v.cadaver===ci));if(vestesC.length){r+="Vestes:\n";vestesC.forEach((v,vi)=>r+=`  ${vi+1}. ${v.tipo} (${v.cor||""}) ${v.sujidades?" Sujidades: "+v.sujidades:""}${v.sangue?" Sangue: "+v.sangue:""}${v.bolsos?" Bolsos: "+v.bolsos:""} ${v.notas||""}\n`);}if(d[cx2+"avancado_decomp"]){r+="DECOMPOSIÇÃO AVANÇADA — Achados:\n";r+=ln("  Abióticos / transformação",(d[cx2+"dec_abio"]||[]).join(", "))+ln("  Fauna cadavérica",(d[cx2+"dec_fauna"]||[]).join(", "))+ln("  Conservação alternativa",(d[cx2+"dec_cons"]||[]).join(", "))+ln("  Achados ambientais",(d[cx2+"dec_amb"]||[]).join(", "))+ln("  Observações decomposição",d[cx2+"dec_obs"]);}
r+=ln("Pertences",d[cx2+"pert"])+ln("Observações gerais",d[cx2+"obs_geral"]);}});const papAllS=[...vsII.map(v=>({desc:v.desc,local:supLoc(v)})),...papilos.filter(p=>p.desc)];if(papAllS.length||d.obs_p){r+="\n━━━ 6.1 PAPILOSCOPIA ━━━\n";if(papAllS.length){papAllS.forEach((p,i)=>r+=`  ${i+1}. ${p.desc} [${p.local||""}]\n`);}r+=ln("Obs papiloscopia",d.obs_p);}veiculos.forEach((vei,vi)=>{const vx=`v${vi}_`;if(d[vx+"tipo"]||d[vx+"placa"]){r+=`\n━━━ 4.2 DO VEÍCULO${veiculos.length>1?" "+(vi+1):""} ━━━\n`;r+=ln("Categoria",d[vx+"cat"]||"Carro")+ln("Tipo",d[vx+"tipo"])+ln("Cor",d[vx+"cor"])+ln("Placa",d[vx+"placa"])+ln("Ano",d[vx+"ano"])+ln("Chassi",d[vx+"chassi"])+ln("Hodômetro",d[vx+"km"])+ln("Estado",d[vx+"estado"])+ln("Motor",d[vx+"motor"])+ln("Portas trav.",d[vx+"portas"])+ln("Vidros íntegros",d[vx+"vidros"])+ln("Chave",d[vx+"chave"])+ln("Obs",d[vx+"obs"]);}});if(fotos&&fotos.length){r+="\n━━━ FOTOGRAFIAS ━━━\n";fotos.forEach((f,i)=>r+=`  ${i+1}. ${f.desc||"Sem desc."} [${f.fase||""}] ${f.local||""} (${f.w}×${f.h}, ${f.sizeKB}KB)\n`);}if(veiVest.length){r+="\n━━━ 5.3 VESTÍGIOS VEICULARES ━━━\n";veiVest.forEach((v,i)=>{const vi3=v.veiculo??0;const vx3="v"+vi3+"_";const tm3=d[vx3+"tipo"]||"";const vl3=veiculos[vi3]?.label||"Veículo";r+=`  ${i+1}. ${v.tipo||v.regionLabel} [${vl3}${tm3?" ("+tm3+")":""} — ${v.regionLabel}]${v.obs?" — "+v.obs:""}\n`;});}return r;};

// Generate body silhouette SVG for PDF with wound markers
  // ──────────────────────────────────────────
  // EXPORTAÇÃO — SVG do corpo para PDF
  // Renderiza apenas as vistas que têm feridas (mesmo princípio dos veículos)
  // Usa as mesmas imagens base64 e coordenadas exatas do app
  // ──────────────────────────────────────────
const bodyPdfSvg=(woundsList)=>{
if(!woundsList||!woundsList.length)return"";
// Numera todas as feridas globalmente
const wByRegion={};woundsList.forEach((w,i)=>{if(!wByRegion[w.region])wByRegion[w.region]=[];wByRegion[w.region].push({n:i+1,tipo:w.tipo,obs:w.obs});});
// Posições centrais [cx,cy] de cada região, extraídas dos componentes BF/BB/HS/MSvg/FootSvg
// Cada vista tem viewBox próprio (mesmo do app)
const POS_FRENTE={"f_cerv_ant":[143,91],"f_supraclav_d":[90,116],"f_supraclav_e":[200,116],"f_esternal":[144,162],"f_torac_d":[89,145],"f_torac_e":[199,145],"f_hipoc_d":[88,182],"f_hipoc_e":[200,182],"f_epigast":[144,216],"f_flanco_d":[74,216],"f_flanco_e":[214,216],"f_mesogast":[117,253],"f_hipogast":[177,253],"f_pubiana":[117,292],"f_genital":[177,292],"f_braco_d":[44,168],"f_braco_e":[244,168],"f_cubital_d":[34,213],"f_cubital_e":[257,213],"f_antebr_d":[23,264],"f_antebr_e":[268,264],"f_coxa_d":[112,367],"f_coxa_e":[177,367],"f_joelho_d":[115,437],"f_joelho_e":[177,437],"f_perna_d":[112,492],"f_perna_e":[177,492]};
const POS_COSTAS={"b_cerv_post":[135,84],"b_deltoid_d":[72,115],"b_deltoid_e":[212,115],"b_escapular_d":[88,153],"b_escapular_e":[195,153],"b_dorsal":[135,162],"b_lombar_d":[102,215],"b_lombar_e":[179,215],"b_sacro_d":[108,253],"b_sacro_e":[175,253],"b_glutea_d":[100,295],"b_glutea_e":[180,295],"b_braco_d":[39,171],"b_braco_e":[247,171],"b_antebr_d":[22,254],"b_antebr_e":[264,254],"b_coxa_d":[112,369],"b_coxa_e":[177,369],"b_perna_d":[112,472],"b_perna_e":[177,472]};
const POS_CABECA_F={"h_frontal":[100,29],"h_orbit_d":[73,62],"h_orbit_e":[127,62],"h_nasal":[100,90],"h_labial_sup":[100,113],"h_labial_inf":[100,127],"h_mentoniana":[100,147]};
const POS_CABECA_B={"h_parietal_d":[70,33],"h_parietal_e":[130,33],"h_vertex":[100,26],"h_occipital":[100,86],"h_auricular_d":[48,98],"h_auricular_e":[152,98]};
const POS_CABECA_E={"h_temporal_e":[80,37],"h_auricular_e":[138,90],"h_occipital":[138,41]};
const POS_CABECA_D={"h_temporal_d":[120,35],"h_auricular_d":[62,90],"h_occipital":[62,41]};
const POS_MAO=(p)=>({[p+"_palma"]:[70,125],[p+"_dorso"]:[70,125],[p+"_polegar"]:[28,81],[p+"_indicador"]:[50,48],[p+"_medio"]:[66,42],[p+"_anelar"]:[80,47],[p+"_minimo"]:[94,59],[p+"_punho"]:[70,175]});
const POS_PE=(p)=>({[p+"_dorso"]:[70,95],[p+"_planta"]:[70,95],[p+"_calcanhar"]:[70,159],[p+"_pl_calcanhar"]:[70,159],[p+"_tornoz"]:[70,15],[p+"_pl_tornoz"]:[70,15],[p+"_dedao"]:[48,184],[p+"_pl_dedao"]:[48,184],[p+"_2dedo"]:[65,188],[p+"_pl_2dedo"]:[65,188],[p+"_3dedo"]:[78,187],[p+"_pl_3dedo"]:[78,187],[p+"_4dedo"]:[89,184],[p+"_pl_4dedo"]:[89,184],[p+"_mindinho"]:[99,179],[p+"_pl_mindinho"]:[99,179]});
// Detecta quais vistas têm feridas
const has=(prefixes)=>woundsList.some(w=>prefixes.some(pr=>w.region&&w.region.startsWith(pr)));
const hasFrente=has(["f_"]);
const hasCostas=has(["b_"]);
const hasCabeca=has(["h_"]);
const hasMaoD=has(["md_"]);
const hasMaoE=has(["me_"]);
const hasPeD=has(["pd_"]);
const hasPeE=has(["pe_"]);
if(!hasFrente&&!hasCostas&&!hasCabeca&&!hasMaoD&&!hasMaoE&&!hasPeD&&!hasPeE)return"";
// Helper para gerar marcadores numerados (círculos vermelhos com número)
const markers=(positions,markerR=10)=>{let m="";Object.entries(wByRegion).forEach(([rid,ws])=>{const pos=positions[rid];if(pos)ws.forEach((w,j)=>{const ox=j*(markerR*2+2);m+=`<circle cx="${pos[0]+ox}" cy="${pos[1]}" r="${markerR}" fill="#ff3b30" stroke="#fff" stroke-width="1.5" opacity="0.92"/><text x="${pos[0]+ox}" y="${pos[1]+4}" text-anchor="middle" font-size="${markerR+1}" font-weight="700" fill="#fff">${w.n}</text>`;});});return m;};
// SVGs vetoriais para mãos e pés (idênticos ao app, sem imagens base64)
const maoPalmaSvg=(p,label,isLeft)=>{const t1=isLeft?'transform="translate(140,0) scale(-1,1)"':'';return `<defs><linearGradient id="gP${p}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ede4da" stop-opacity="0.5"/><stop offset="100%" stop-color="#ddd0c0" stop-opacity="0.3"/></linearGradient></defs><g ${t1}><path d="M40 160 L35 120 Q34 100 45 90 L55 82 Q70 78 85 82 L95 90 Q106 100 105 120 L100 160Z" fill="url(#gP${p})" stroke="#999" stroke-width="0.6"/><rect x="40" y="160" width="60" height="30" rx="8" fill="url(#gP${p})" stroke="#999" stroke-width="0.5"/><path d="M48 82 L46 20 Q48 14 52 14 Q56 14 58 20 L58 82" fill="none" stroke="#999" stroke-width="0.5"/><path d="M60 80 L60 10 Q62 4 66 4 Q70 4 72 10 L72 80" fill="none" stroke="#999" stroke-width="0.5"/><path d="M74 82 L76 18 Q78 12 82 12 Q86 12 84 18 L82 82" fill="none" stroke="#999" stroke-width="0.5"/><path d="M86 88 L90 34 Q92 28 96 28 Q100 28 98 34 L96 88" fill="none" stroke="#999" stroke-width="0.5"/><path d="M35 120 L22 100 Q16 90 18 80 L22 70 Q26 64 32 62 Q36 62 38 66 L42 80" fill="none" stroke="#999" stroke-width="0.5"/></g><text x="70" y="198" text-anchor="middle" font-size="8" font-weight="600" fill="#888">${label}</text>`;};
const peSvg=(label,planta)=>{const linhas=planta?'<path d="M42 60 Q70 50 98 60" fill="none" stroke="#ddd" stroke-width="0.3"/><path d="M38 100 Q70 90 102 100" fill="none" stroke="#ddd" stroke-width="0.3"/><path d="M40 140 Q70 132 100 140" fill="none" stroke="#ddd" stroke-width="0.3"/>':'<path d="M50 50 Q70 42 90 50" fill="none" stroke="#ddd" stroke-width="0.3"/><line x1="70" y1="40" x2="70" y2="170" stroke="#eee" stroke-width="0.15" stroke-dasharray="2 3"/>';return `<defs><linearGradient id="gFt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ede4da" stop-opacity="0.5"/><stop offset="100%" stop-color="#ddd0c0" stop-opacity="0.3"/></linearGradient></defs><rect x="45" y="0" width="50" height="30" rx="10" fill="url(#gFt)" stroke="#999" stroke-width="0.5"/><path d="M40 30 Q30 50 28 80 Q26 110 30 140 Q32 160 40 170 Q50 178 60 180 L80 180 Q100 178 108 168 Q114 155 112 140 Q110 110 108 80 Q106 50 100 30Z" fill="url(#gFt)" stroke="#999" stroke-width="0.6"/>${linhas}<ellipse cx="48" cy="184" rx="10" ry="8" fill="url(#gFt)" stroke="#999" stroke-width="0.4"/><ellipse cx="65" cy="188" rx="7" ry="7" fill="url(#gFt)" stroke="#999" stroke-width="0.4"/><ellipse cx="78" cy="187" rx="6" ry="6" fill="url(#gFt)" stroke="#999" stroke-width="0.4"/><ellipse cx="89" cy="184" rx="6" ry="6" fill="url(#gFt)" stroke="#999" stroke-width="0.4"/><ellipse cx="99" cy="179" rx="5" ry="5" fill="url(#gFt)" stroke="#999" stroke-width="0.4"/><text x="70" y="210" text-anchor="middle" font-size="7" font-weight="600" fill="#888">${label}</text>`;};
// Monta as vistas (cada uma com seu viewBox real do app)
const views=[];
if(hasFrente){views.push({vb:"0 0 292 650",w:240,svg:`<image href="${BODY_F}" x="0" y="0" width="292" height="625"/><text x="146" y="645" text-anchor="middle" font-size="10" font-weight="600" fill="#888">ANTERIOR</text>`+markers(POS_FRENTE,11)});}
if(hasCostas){views.push({vb:"0 0 288 650",w:240,svg:`<image href="${BODY_B}" x="0" y="0" width="288" height="625"/><text x="145" y="645" text-anchor="middle" font-size="10" font-weight="600" fill="#888">POSTERIOR</text>`+markers(POS_COSTAS,11)});}
if(hasCabeca){
  const hasFr=woundsList.some(w=>w.region&&POS_CABECA_F[w.region]);
  const hasBk=woundsList.some(w=>w.region&&POS_CABECA_B[w.region]);
  const hasLE=woundsList.some(w=>w.region&&POS_CABECA_E[w.region]);
  const hasLD=woundsList.some(w=>w.region&&POS_CABECA_D[w.region]);
  if(hasFr)views.push({vb:"0 0 200 220",w:160,svg:`<image href="${HEAD_F}" x="0" y="0" width="200" height="200"/><text x="100" y="216" text-anchor="middle" font-size="9" font-weight="600" fill="#888">CABEÇA — FRENTE</text>`+markers(POS_CABECA_F,9)});
  if(hasBk)views.push({vb:"0 0 200 220",w:160,svg:`<image href="${HEAD_B}" x="0" y="0" width="200" height="200"/><text x="100" y="216" text-anchor="middle" font-size="9" font-weight="600" fill="#888">CABEÇA — ATRÁS</text>`+markers(POS_CABECA_B,9)});
  if(hasLE)views.push({vb:"0 0 200 220",w:160,svg:`<image href="${HEAD_L}" x="0" y="0" width="200" height="200"/><text x="100" y="216" text-anchor="middle" font-size="9" font-weight="600" fill="#888">CABEÇA — PERFIL ESQUERDO</text>`+markers(POS_CABECA_E,9)});
  if(hasLD)views.push({vb:"0 0 200 220",w:160,svg:`<image href="${HEAD_R}" x="0" y="0" width="200" height="200"/><text x="100" y="216" text-anchor="middle" font-size="9" font-weight="600" fill="#888">CABEÇA — PERFIL DIREITO</text>`+markers(POS_CABECA_D,9)});
}
if(hasMaoD){views.push({vb:"0 0 140 200",w:130,svg:maoPalmaSvg("mD","PALMA D",false)+markers(POS_MAO("md"),8)});}
if(hasMaoE){views.push({vb:"0 0 140 200",w:130,svg:maoPalmaSvg("mE","PALMA E",true)+markers(POS_MAO("me"),8)});}
if(hasPeD){views.push({vb:"0 0 140 220",w:130,svg:peSvg("PÉ DIREITO",false)+markers(POS_PE("pd"),8)});}
if(hasPeE){views.push({vb:"0 0 140 220",w:130,svg:peSvg("PÉ ESQUERDO",false)+markers(POS_PE("pe"),8)});}
let html=`<div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin:14px 0;page-break-inside:avoid">`;
views.forEach(v=>{html+=`<div style="text-align:center"><svg viewBox="${v.vb}" width="${v.w}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${v.svg}</svg></div>`;});
html+=`</div>`;
return html;};
// FULL PDF builder - ALL sections
  // ──────────────────────────────────────────
  // EXPORTAÇÃO — Geração de nome de arquivo padronizado
  // Padrão: Croqui_OC_[número]-[ano]-[DP]-[dia][mês]-[natureza]
  // ──────────────────────────────────────────
const MESES_ABR=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const NAT_ABR={"Homicídio":"Hom","Feminicídio":"Fem","Tentativa de feminicídio":"TFem","Tentativa de homicídio":"THom","Lesão corporal":"LC","Suicídio":"Sui","Cadáver encontrado":"CadEnc","Afogado":"Afog","Estupro":"Est","Complementar":"Compl","Pátio":"Pat","Outros":"Out"};
const mkFileName=(ext,prefixo)=>{const d=data;const oc=d.oc||"sem_oc";const ano=(d.oc_ano||"").slice(-4);const dpRaw=d.dp==="Outro"?(d.dp_outro||""):(d.dp||"");const dp=dpRaw.replace(/[ªº\s]/g,"");const now=new Date();const dia=String(now.getDate()).padStart(2,"0");const mes=MESES_ABR[now.getMonth()];const natRaw=d.nat==="Outros"&&d.nat_outro?d.nat_outro:d.nat||"";const nat=NAT_ABR[natRaw]||natRaw.slice(0,6).replace(/\s/g,"");const pre=prefixo||"Croqui";const parts=[pre,"OC",oc+"-"+ano+"-"+dp+"-"+dia+mes+(nat?"-"+nat:"")].filter(Boolean);return parts.join("_").replace(/[^a-zA-Z0-9_\-çãõáéíóúâêôàüÇÃÕÁÉÍÓÚÂÊÔÀÜ.]/g,"")+"."+ext;};
  // ──────────────────────────────────────────
  // EXPORTAÇÃO — Geração HTML do croqui (bPDF)
  // Monta o HTML completo do laudo para PDF/DOCX
  // ──────────────────────────────────────────
const esc=(s)=>typeof s==="string"?s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):s;
// Helper: retorna o suporte/local com complemento de placa quando existir (para PDF/RRV/DOCX)
const supPlaca=(sup,placa)=>{const s=(sup||"").trim();const p=(placa||"").trim();if(!p)return s;return s?`${s} — Vestígio correlacionado à placa ${p}`:`Vestígio correlacionado à placa ${p}`;};
// v236: helper que combina suporte+placa+coordenadas (D1/D2/h) — usado nos
// exports de cadeia de custódia para que as distâncias do vestígio (medidas
// pelo perito no local) não fiquem só no backup JSON.
const supLoc=(v)=>{const base=supPlaca(v.suporte,v.placa);const c1=(v.coord1||"").trim();const c2=(v.coord2||"").trim();const h=(v.altura||"").trim();const parts=[];if(c1)parts.push(`D1: ${c1}`);if(c2)parts.push(`D2: ${c2}`);if(h)parts.push(`h: ${h}`);const coords=parts.length?` (${parts.join(", ")})`:"";return `${base}${coords}`;};
const bPDF=()=>{const d=data;
// Cores institucionais
const PRIMARY="#1A1A2E";const GOLD="#C9A961";const ZEBRA="#F5F5F7";const BORDER="#C8D6E5";const LIGHT="#E8E8EC";
// Helpers HTML
const sec1=(num,t2)=>`<h2 style="font-size:13px;font-weight:700;color:${PRIMARY};margin:18px 0 8px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1.5px solid ${GOLD};padding-bottom:4px">${num} ${t2}</h2>`;
const sec2=(num,t2)=>`<h3 style="font-size:14px;font-weight:700;color:${PRIMARY};margin:16px 0 7px">${num} ${t2}</h3>`;
const sec3=(num,t2)=>`<h4 style="font-size:13px;font-weight:700;font-style:italic;color:${PRIMARY};margin:12px 0 5px">${num} ${t2}</h4>`;
const secCenter=(t2)=>`<h2 style="font-size:14px;font-weight:700;color:${PRIMARY};margin:20px 0 12px;text-transform:uppercase;letter-spacing:0.8px;text-align:center">${t2}</h2>`;
const para=(t2)=>`<p style="font-size:11px;text-align:justify;text-indent:18px;margin:4px 0 8px;line-height:1.5">${t2}</p>`;
// tbl builder with zebra
const tblZ=(rows)=>{const filtered=rows.filter(x=>x);if(!filtered.length)return"";let h2=`<table style="width:100%;border-collapse:collapse;border:1px solid ${BORDER};margin:4px 0 8px">`;filtered.forEach((item,i)=>{const fill=(i%2===0)?ZEBRA:"#FFFFFF";h2+=`<tr><td style="padding:5px 10px;font-weight:600;color:${PRIMARY};width:30%;font-size:11px;border:1px solid ${BORDER};background:${LIGHT}">${item[0]}</td><td style="padding:5px 10px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(Array.isArray(item[1])?item[1].join(", "):(item[1]||""))}</td></tr>`;});return h2+`</table>`;};
const tblList=(items,cols,getRow)=>{if(!items.length)return"";let h2=`<table style="width:100%;border-collapse:collapse;border:1px solid ${BORDER};margin:4px 0 8px"><tr style="background:${PRIMARY};color:#fff">${cols.map(c=>`<th style="padding:6px 8px;font-size:11px;border:1px solid ${BORDER};text-align:left;font-weight:700">${c}</th>`).join("")}</tr>`;items.forEach((item,i)=>{h2+=getRow(item,i);});return h2+`</table>`;};
// =========== BODY START ============
let h="";
// --- Cabeçalho institucional (primeira página) ---
h+=`<div style="display:grid;grid-template-columns:70px 1fr 70px;align-items:center;border-bottom:2.5px solid ${GOLD};padding-bottom:8px;margin-bottom:12px">
<div style="text-align:center"><img src="data:image/jpeg;base64,${LOGO_PCDF_B64}" style="height:60px" alt="PCDF"/></div>
<div style="text-align:center;font-size:12px;font-weight:700;color:${PRIMARY};line-height:1.55">POLÍCIA CIVIL DO DISTRITO FEDERAL<br>DEPARTAMENTO DE POLÍCIA TÉCNICA<br>INSTITUTO DE CRIMINALÍSTICA<br>SEÇÃO DE CRIMES CONTRA A PESSOA</div>
<div style="text-align:center"><img src="data:image/jpeg;base64,${LOGO_DF_B64}" style="height:60px" alt="DF"/></div>
</div>`;
// --- Título do documento ---
h+=`<div style="text-align:center;margin:24px 0 32px">
<div style="font-size:24px;font-weight:700;color:${PRIMARY};letter-spacing:1px;line-height:1.4">CROQUI DE LEVANTAMENTO DE LOCAL</div>
</div>`;
// --- RESUMO DA OCORRÊNCIA (capa resumida) ---
const natLbl=d.nat==="Outros"?(d.nat_outro||"—"):(d.nat||"—");
const perito1=d.p1||loginName||"—";
const perito2=d.p2||"";
const matP1=d.mat_p1||loginMat||"";
const matP2=d.mat_p2||"";
const peritoLabel=perito2?`${perito1}${matP1?" (mat. "+matP1+")":""} e ${perito2}${matP2?" (mat. "+matP2+")":""}`:`${perito1}${matP1?" (mat. "+matP1+")":""}`;
const diagCad=d.c0_dg||"—";
const cadCount=cadaveres.filter((_,ci)=>d[`c${ci}_fx`]||d[`c${ci}_dg`]||d[`c${ci}_sx`]||wounds.some(w=>w.cadaver===ci)).length;
const vestTotal=vestigios.filter(v=>v.desc).length+canvasVest.filter(v=>v.desc).length;
const vestRecolhidos=[...vestigios.filter(v=>v.desc&&v.recolhido==="Sim"),...canvasVest.filter(v=>v.desc&&v.recolhido==="Sim")].length;
// === RESUMO DA OCORRÊNCIA UNIFICADO (dourado, com subtítulos) ===
// v234: igual ao DOCX — valores vazios retornam "" para que ROW_GP os omita
const cadDesc=(()=>{const partes=[];cadaveres.forEach((c,ci)=>{const cx2=`c${ci}_`;const fx=d[cx2+"fx"]||"";const sx=d[cx2+"sx"]||"";const et=d[cx2+"et"]||"";if(fx||sx){partes.push([sx,et,fx].filter(x=>x&&x!=="Prejudicado"&&x!=="Prejudicada").join(", ")||"Cadáver "+(ci+1));}});return partes.length?partes.join("; "):"";})();
const instrumentoExec=(()=>{const ins=d.c0_ins||"";const insO=d.c0_ins_o||"";const sui=d.c0_sui_tipo||"";return [ins,insO,sui].filter(Boolean).filter(x=>x!=="Outro").join(" / ")||"";})();
const woundsTotal=wounds.length;
const agenteLblP=d.ag==="Outro"?(d.ag_outro||""):(d.ag||"");
const papiloLblP=d.pp?`${d.pp==="Outro"?(d.pp_outro||""):d.pp}${d.mat_pp?` (mat. ${d.mat_pp})`:""}`:"";
const viaturaLblP=d.vt==="Outra"?(d.vt_outro||""):(d.vt||"");
const oicLblP=d.oic||"";
const tipoLocalLblP=Array.isArray(d.tp)&&d.tp.length?d.tp.join(", "):(d.tp||"");
const recursosP=[];
if(d.drone==="Sim")recursosP.push("Drone");
if(d.scanner==="Sim")recursosP.push("Scanner 3D");
if(d.luminol==="Sim")recursosP.push("Luminol");
if(d.luz_forense==="Sim")recursosP.push("Luz forense");
const recursosLblP=recursosP.length?recursosP.join(", "):"";
const veicsComDataP=veiculos.filter((_,vi)=>d[`v${vi}_tipo`]||d[`v${vi}_placa`]).length;
const edifsComDataP=edificacoes.filter(e=>e&&(e.tipo||e.material||e.andares||(e.comodos_list&&e.comodos_list.length)||(e.comodos_fato&&e.comodos_fato.length))).length;
const trilhasComDataP=trilhas.filter(tr=>tr&&(tr.origem||tr.destino||tr.padrao||tr.comprimento||tr.obs)).length;
// Linha de leitura rápida (TL;DR)
const tldrPartesP=[];
tldrPartesP.push(natLbl);
if(tipoLocalLblP&&tipoLocalLblP!=="—")tldrPartesP.push(`em ${tipoLocalLblP}`);
if(woundsTotal>0)tldrPartesP.push(`${woundsTotal} lesão${woundsTotal>1?"ões":""} documentada${woundsTotal>1?"s":""}`);
if(vestTotal>0)tldrPartesP.push(`${vestTotal} vestígio${vestTotal>1?"s":""}${vestRecolhidos?` (${vestRecolhidos} recolhido${vestRecolhidos>1?"s":""})`:""}`);
const fotosCountP=(fotos||[]).length;
if(fotosCountP>0)tldrPartesP.push(`${fotosCountP} fotografia${fotosCountP>1?"s":""}`);
const tldrTextoP=tldrPartesP.join(" · ");
// Helpers HTML — page-break-inside:avoid em rows; subtítulos com page-break-after:avoid (não ficam órfãos)
const isPendingValueP=(v)=>{const s=String(v||"").trim().toLowerCase();return s==="a esclarecer"||s==="—"||s==="-"||s==="a ser informado"||s==="a ser descrito";};
const ROW_GP=(label,val,zebra)=>{if(!val&&val!==0)return"";const fill=zebra?"#FFFCEF":"#FFF8E8";const pending=isPendingValueP(val);const valStyle=pending?"font-style:italic;color:#9A8B6A;":"";return`<tr style="page-break-inside:avoid"><td style="padding:6px 14px;font-weight:700;color:#6B5326;width:32%;font-size:11px;background:#E8D9A8;border-bottom:1px solid #E8D9A8">${label}</td><td style="padding:6px 14px;font-size:11.5px;background:${fill};border-bottom:1px solid #E8D9A8;${valStyle}">${esc(String(val))}</td></tr>`;};
const ROW_GG=(title)=>`<tr style="page-break-inside:avoid;page-break-after:avoid"><td colspan="2" style="padding:7px 14px;font-weight:700;color:#fff;font-size:11.5px;background:#C9A961;letter-spacing:1px;text-transform:uppercase;border-bottom:1.5px solid #B89651">${title}</td></tr>`;
let resumoZebra=false;
const rg=(l,v)=>{const out=ROW_GP(l,v,resumoZebra);if(out)resumoZebra=!resumoZebra;return out;};
const rgg=(t)=>{resumoZebra=false;return ROW_GG(t);};
// v234: monta linhas em array e filtra grupos órfãos antes de gerar HTML.
// kr() e krNum() são iguais aos do DOCX — retornam null para valores vazios.
const krP=(label,val)=>{if(val===null||val===undefined||val==="")return null;const s=String(val).trim();if(!s||s==="—"||s==="0"||s==="0 total")return null;return {label,val:String(val)};};
const krNumP=(label,n)=>(n>0?{label,val:String(n)}:null);
const resumoBlocos=[
  {group:"Identificação",rows:[
    krP("Ocorrência / DP",(d.oc||d.oc_ano||d.dp)?`${d.oc||"___"}/${d.oc_ano||"____"} — ${d.dp==="Outro"?(d.dp_outro||"___"):(d.dp||"___")}`:""),
    krP("Natureza",natLbl),
    krP("Vítima(s)",cadDesc),
    krP("Instrumento / meio",instrumentoExec),
    krP("Exame Externo",oicLblP),
  ]},
  {group:"Local",rows:[
    krP("Endereço",d.end),
    krP("GPS",d.gps),
    krP("Tipo do local",tipoLocalLblP),
  ]},
  {group:"Datas",rows:[
    krP("Data da solicitação",d.dt_sol),
    krP("Data do deslocamento",d.dt_des),
    krP("Data do atendimento",d.dt_che),
    krP("Data da finalização",d.dt_ter),
  ]},
  {group:"Equipe",rows:[
    krP("Perito(s) criminais",peritoLabel),
    krP("Agente",agenteLblP),
    krP("Papiloscopista",papiloLblP),
    krP("Viatura",viaturaLblP),
    recursosP.length?{label:"Recursos empregados",val:recursosLblP}:null,
  ]},
  {group:"Achados",rows:[
    krP("Diagnóstico",diagCad),
    krNumP("Cadáveres",cadCount),
    vestTotal>0?{label:"Vestígios",val:`${vestTotal} total${vestRecolhidos?` (${vestRecolhidos} recolhidos)`:""}`}:null,
    krNumP("Lesões documentadas",woundsTotal),
    krNumP("Edificações examinadas",edifsComDataP),
    krNumP("Veículos examinados",veicsComDataP),
    krNumP("Trilhas de sangue",trilhasComDataP),
    krNumP("Fotografias",(fotos||[]).length),
  ]},
];
let tableRowsHtml="";
resumoBlocos.forEach(bloco=>{const rowsValidas=bloco.rows.filter(x=>x);if(!rowsValidas.length)return;tableRowsHtml+=rgg(bloco.group);rowsValidas.forEach(r=>{tableRowsHtml+=rg(r.label,r.val);});});
h+=`<div style="border:2px solid #C9A961;border-radius:6px;padding:0;margin:0 0 20px;overflow:hidden;page-break-inside:avoid">
<div style="background:#C9A961;color:#fff;padding:10px 16px;font-size:14px;font-weight:700;letter-spacing:1.2px;text-align:center;text-transform:uppercase">⚖️ Resumo da Ocorrência</div>
${tldrTextoP?`<div style="padding:8px 16px;background:#FFFCEF;font-size:12px;font-style:italic;text-align:center;color:#6B5326;border-bottom:1px solid #E8D9A8">${esc(tldrTextoP)}</div>`:""}
<table style="width:100%;border-collapse:collapse">
${tableRowsHtml}
</table>
</div>`;
// --- PREÂMBULO ---
h+=`<div style="page-break-before:always"></div>`;
h+=secCenter("PREÂMBULO");
const dataHoje=new Date().toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"});
const peritoDesig=perito2?`Peritos Criminais ${esc(perito1)}${matP1?", matrícula "+esc(matP1)+",":""} e ${esc(perito2)}${matP2?", matrícula "+esc(matP2)+",":""}`:`Perito Criminal ${esc(perito1)}${matP1?", matrícula "+esc(matP1)+",":""}`;
const dpResolved=d.dp==="Outro"?(d.dp_outro||""):(d.dp||"");
const delegaciaTxt=dpResolved?`${esc(dpResolved)}${d.dp==="Outro"?"":"ª"} Delegacia de Polícia${d.dp==="Outro"?"":` (${esc(dpResolved)}ª DP)`}`:"Delegacia de Polícia";
h+=para(`Em ${dataHoje}, o Diretor do Instituto de Criminalística designou ${peritoDesig} para procederem a exame de local, descreverem minuciosamente o que examinarem e esclarecerem tudo que possa interessar a fim de atender à solicitação da autoridade da ${delegaciaTxt}.`);
// Equipe complementar (papiloscopista, agente, viatura) e exame externo
const ppNome=d.pp==="Outro"?d.pp_outro:d.pp;
const agNome=d.ag==="Outro"?d.ag_outro:d.ag;
const vtNome=d.vt==="Outra"?d.vt_outro:d.vt;
const eqExtras=[];
if(ppNome)eqExtras.push(`Papiloscopista ${esc(ppNome)}${d.mat_pp?", matrícula "+esc(d.mat_pp):""}`);
if(agNome)eqExtras.push(`Agente Policial ${esc(agNome)}`);
if(eqExtras.length)h+=para(`A equipe pericial foi composta também por ${eqExtras.join(" e ")}.`);
if(vtNome)h+=para(`O deslocamento foi realizado com a viatura ${esc(vtNome)}.`);
if(d.oic)h+=para(`Esta perícia foi realizada em conjunto com o exame externo cadavérico, sob a responsabilidade do Perito Criminal ${esc(d.oic)}.`);
if(d.obs_sol)h+=para(`<b>Informações prévias da solicitação:</b> ${esc(d.obs_sol)}`);
// --- 1 HISTÓRICO ---
h+=sec1("1","Histórico");
const horaSol=d.dt_sol||"horário registrado no sistema";
const enderecoHist=d.end||"endereço a ser informado";
const gpsHist=d.gps?` relacionado às coordenadas geográficas ${esc(d.gps)} (datum WGS 84)`:"";
h+=para(`A fim de atender à solicitação supracitada, feita via rede interna de computadores da Polícia Civil do Distrito Federal (<i>intranet</i>), os Peritos Criminais compareceram, às ${esc(horaSol)}, ao endereço ${esc(enderecoHist)}${gpsHist}, onde realizaram os exames descritos a seguir.`);
// --- 2 OBJETIVO PERICIAL ---
h+=sec1("2","Objetivo Pericial");
h+=para(`O exame teve por objetivo a busca e a constatação, no local de solicitação ou nas suas proximidades, de elementos materiais possivelmente relacionados à Ocorrência Policial ${esc(d.oc||"___")}/${esc(d.oc_ano||"____")} – ${esc(dpResolved||"___")}${d.dp==="Outro"?"":"ª DP"}, registrada, no momento do exame, com a natureza de "${esc(natLbl)}".`);
// --- 2.1 RECURSOS EMPREGADOS (NOVO v161) ---
if(d.drone||d.scanner||d.luminol||d.luz_forense){const recs=[];if(d.drone==="Sim")recs.push("drone");if(d.scanner==="Sim")recs.push("scanner 3D");if(d.luminol==="Sim")recs.push("luminol");if(d.luz_forense==="Sim")recs.push("luz forense");if(recs.length){h+=sec2("2.1","Recursos Especiais Empregados");h+=para(`Durante o exame foi(ram) empregado(s) o(s) seguinte(s) recurso(s) técnico(s): ${recs.join(", ")}.`);}}
// --- 3 ISOLAMENTO DO LOCAL ---
h+=sec1("3","Isolamento do Local e Presença de Agente Estatal");
const isoTxt=d.iso||"a ser descrito";
const respTxt=d.rp?`sob a responsabilidade de ${esc(d.rp)}${d.mt?`, matrícula ${esc(d.mt)}`:""}${d.org?`, ${esc(d.org)}`:""}`:"";
h+=para(`Quando da chegada da equipe pericial, o local a ser examinado encontrava-se ${esc(isoTxt.toLowerCase())}${respTxt?" e "+respTxt:""}.`);
if(d.pres||d.vr||d.obs_i){h+=tblZ([d.pres?["Preservação",d.pres]:null,d.vr?["Viatura isol.",d.vr]:null,d.obs_i?["Observações",d.obs_i]:null]);}
// --- 4 EXAMES ---
h+=sec1("4","Exames");
// 4.1 Do Local
h+=sec2("4.1","Do Local");
const localResumo=[];
if(d.area)localResumo.push(`em área ${d.area.toLowerCase()}`);
if(d.dest)localResumo.push(`destinação ${d.dest.toLowerCase()}`);
if(d.tp)localResumo.push(`classificado como ${tpStr(d.tp).toLowerCase()}`);
if(localResumo.length)h+=para(`O local examinado situava-se ${localResumo.join(", ")}.`);
h+=tblZ([d.end?["Endereço",d.end]:null,d.gps?["GPS",d.gps]:null,d.area?["Área",d.area]:null,d.dest?["Destinação",d.dest]:null,d.tp?["Tipo",tpStr(d.tp)]:null,d.via?["Via",d.via]:null,d.ilu?["Iluminação",d.ilu]:null,d.ilul?["Ligada",d.ilul]:null,d.obs_l?["Observações",d.obs_l]:null]);
if(tpHas(d.tp,"Via pública")){h+=`<h5 style="font-size:12px;color:${PRIMARY};margin:10px 0 5px;font-weight:700">Via pública — características</h5>`;h+=tblZ([d.vp_pav?["Pavimento",d.vp_pav]:null,d.vp_faixas?["Faixas",d.vp_faixas]:null,d.vp_mao?["Mão",d.vp_mao]:null,d.vp_canteiro?["Canteiro central",d.vp_canteiro]:null,d.vp_canteiro==="Sim"&&d.vp_canteiro_tipo?["Tipo canteiro",d.vp_canteiro_tipo]:null,d.vp_meiofio?["Meio-fio",d.vp_meiofio]:null,d.vp_calcada?["Calçada",d.vp_calcada]:null,d.vp_transito?["Trânsito",d.vp_transito]:null,d.vp_frenagem?["Frenagem",d.vp_frenagem]:null,d.vp_frenagem==="Sim"&&d.vp_frenagem_comp?["Comp. frenagem",d.vp_frenagem_comp]:null,d.vp_derrapagem?["Derrapagem",d.vp_derrapagem]:null,d.vp_debris?["Debris",d.vp_debris]:null,d.vp_debris==="Sim"&&d.vp_debris_obs?["Obs debris",d.vp_debris_obs]:null,d.vp_obs_caract?["Obs características",d.vp_obs_caract]:null,d.vp_obs_cond?["Obs condições",d.vp_obs_cond]:null]);const vpMp=[...(d.vp_mr||[]),...(d.vp_mi||[]),...(d.vp_ma||[]),...(d.vp_mac||[]),...(d.vp_me||[]),...(d.vp_mo||[])];if(vpMp.length){h+=`<h5 style="font-size:12px;color:${PRIMARY};margin:10px 0 5px;font-weight:700">Via pública — manchas de sangue</h5>`;h+=tblZ([["Padrões identificados",vpMp.join(", ")],d.vp_obs_manchas?["Observações",d.vp_obs_manchas]:null]);}}
if(d.dest==="Área verde"&&(d.av_veg||d.av_obs)){h+=`<h5 style="font-size:12px;color:${PRIMARY};margin:10px 0 5px;font-weight:700">Área verde — vegetação</h5>`;h+=tblZ([d.av_veg?["Tipo de vegetação",d.av_veg]:null,d.av_obs?["Observações",d.av_obs]:null]);}
if(trilhas.length>0){h+=`<h5 style="font-size:12px;color:${PRIMARY};margin:10px 0 5px;font-weight:700">Trilhas de sangue</h5>`;trilhas.forEach((tr,ti)=>{const ind3=[];if(tr.pegadas==="Sim")ind3.push("Pegadas");if(tr.arrasto==="Sim")ind3.push("Arrasto");if(tr.maos==="Sim")ind3.push("Mãos");if(tr.satelite==="Sim")ind3.push("Gotas satélite");if(tr.diminuicao==="Sim")ind3.push("Diminuição progressiva");h+=`<div style="background:#ffe0e0;padding:4px 8px;margin-top:6px;font-size:10px;font-weight:700;color:${PRIMARY}">🩸 Trilha ${ti+1}</div>`;h+=tblZ([tr.origem?["Origem",tr.origem]:null,tr.gps_origem?["GPS Início",tr.gps_origem]:null,tr.destino?["Destino",tr.destino]:null,tr.gps_destino?["GPS Fim",tr.gps_destino]:null,tr.comprimento?["Comprimento",tr.comprimento+"m"]:null,tr.padrao?["Padrão",tr.padrao]:null,tr.continuidade?["Continuidade",tr.continuidade]:null,tr.direcionamento?["Direcionamento",tr.direcionamento]:null,tr.acumulo_qtd?["Acúmulo qtd.",tr.acumulo_qtd]:null,tr.acumulo_vol?["Acúmulo vol.",tr.acumulo_vol]:null,tr.acumulo_local?["Acúmulo local",tr.acumulo_local]:null,ind3.length?["Indicadores",ind3.join(", ")]:null,tr.diluicao?["Diluição",tr.diluicao]:null,tr.interferencia?["Interferência",tr.interferencia]:null,tr.interferencia==="Sim"&&tr.interferencia_obs?["Obs interferência",tr.interferencia_obs]:null,tr.obs?["Observações",tr.obs]:null]);});}
edificacoes.forEach((e,ei)=>{if(e.tipo||e.nome){h+=`<h5 style="font-size:12px;color:${PRIMARY};margin:10px 0 5px;font-weight:700">Edificação ${ei+1}${e.tipo?" — "+esc(e.tipo):""}${e.nome?" ("+esc(e.nome)+")":""}</h5>`;h+=tblZ([e.tipo?["Tipo",e.tipo]:null,e.nome?["Descrição complementar",e.nome]:null,e.material?["Material",e.material]:null,e.andares?["Andares",e.andares]:null,e.cobertura?["Cobertura",e.cobertura]:null,e.estado?["Estado",e.estado]:null,e.muro?["Perímetro/muro",e.muro]:null,e.portao?["Portão",e.portao]:null,e.acesso?["Acesso",e.acesso]:null,e.n_entradas?["Entradas",e.n_entradas]:null,e.ilum_int?["Iluminação interna",e.ilum_int]:null,e.cameras?["Câmeras",e.cameras]:null,e.vizinhanca?["Vizinhança",e.vizinhanca]:null,e.comodos_list?.length?["Cômodos",e.comodos_list.join(", ")]:null,e.comodos_fato?.length?["Cômodos do fato",e.comodos_fato.join(", ")]:null,e.obs?["Observações",e.obs]:null]);if(e.comodos_fato_det&&e.comodos_fato?.length){e.comodos_fato.forEach(cf=>{const det=(e.comodos_fato_det||{})[cf];if(det){const allM2=[...(det.mr||[]),...(det.mi||[]),...(det.ma||[]),...(det.mac||[]),...(det.me||[]),...(det.mo||[])];if(det.estado||allM2.length||det.obs_manchas||det.obs_comodo){h+=`<h6 style="font-size:10px;color:${PRIMARY};margin:6px 0 3px;font-weight:700">📍 ${esc(cf)}</h6>`;h+=tblZ([det.estado?["Estado",det.estado]:null,allM2.length?["Manchas",allM2.join(", ")]:null,det.obs_manchas?["Obs manchas",det.obs_manchas]:null,det.obs_comodo?["Obs cômodo",det.obs_comodo]:null]);}}});}}});
// 4.2 Do Veículo (se houver)
const veicsComData=veiculos.filter((_,vi)=>d[`v${vi}_tipo`]||d[`v${vi}_placa`]);
if(veicsComData.length>0){h+=sec2("4.2","Do Veículo");veiculos.forEach((vei,vi)=>{const vx=`v${vi}_`;if(d[vx+"tipo"]||d[vx+"placa"]){if(veicsComData.length>1)h+=`<h5 style="font-size:12px;color:${PRIMARY};margin:10px 0 5px;font-weight:700">Veículo ${vi+1}</h5>`;h+=tblZ([d[vx+"cat"]?["Categoria",d[vx+"cat"]]:null,d[vx+"tipo"]?["Tipo",d[vx+"tipo"]]:null,d[vx+"cor"]?["Cor",d[vx+"cor"]]:null,d[vx+"placa"]?["Placa",d[vx+"placa"]]:null,d[vx+"ano"]?["Ano",d[vx+"ano"]]:null,d[vx+"chassi"]?["Chassi",d[vx+"chassi"]]:null,d[vx+"km"]?["Hodômetro",d[vx+"km"]]:null,d[vx+"estado"]?["Estado",d[vx+"estado"]]:null,d[vx+"motor"]?["Motor",d[vx+"motor"]]:null,d[vx+"portas"]?["Portas travadas",d[vx+"portas"]]:null,d[vx+"vidros"]?["Vidros íntegros",d[vx+"vidros"]]:null,d[vx+"chave"]?["Chave",d[vx+"chave"]]:null,d[vx+"obs"]?["Observações",d[vx+"obs"]]:null]);}});if(veiVest.length){h+=`<h5 style="font-size:12px;color:${PRIMARY};margin:10px 0 5px;font-weight:700">Vestígios veiculares</h5>`;h+=tblList(veiVest,["Nº","Vestígio","Suporte"],(v,i)=>{const vi3=v.veiculo??0;const vx3="v"+vi3+"_";const tm3=d[vx3+"tipo"]||"";const vl3=veiculos[vi3]?.label||"Veículo";const sup3=`${vl3}${tm3?" ("+tm3+")":""} — ${v.regionLabel}`;const fill=(i%2===0)?ZEBRA:"#FFFFFF";return `<tr><td style="padding:5px 8px;font-size:11px;border:1px solid ${BORDER};background:${LIGHT};text-align:center;width:8%">${i+1}</td><td style="padding:5px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc((v.tipo||v.regionLabel)+(v.obs?" — "+v.obs:""))}</td><td style="padding:5px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(sup3)}</td></tr>`;});}}
// 4.3 Do Cadáver
const subCadBase=veicsComData.length>0?"4.3":"4.2";
cadaveres.forEach((cad,ci)=>{const cx=`c${ci}_`;const woundsC=wounds.filter(w=>w.cadaver===ci);const hasCad=d[cx+"fx"]||d[cx+"et"]||d[cx+"sx"]||woundsC.length>0||d[cx+"dg"];if(hasCad){if(cadaveres.length>1)h+=sec2(subCadBase,`Do Cadáver ${ci+1}`);else if(ci===0)h+=sec2(subCadBase,"Do Cadáver");
// 4.3.1 Descrição
h+=sec3(`${subCadBase}.1`,"Descrição");
const descParts=[];if(d[cx+"fx"])descParts.push(`faixa etária ${d[cx+"fx"].toLowerCase()}`);if(d[cx+"et"])descParts.push(`etnia ${d[cx+"et"].toLowerCase()}`);if(d[cx+"sx"])descParts.push(`sexo ${d[cx+"sx"].toLowerCase()}`);if(d[cx+"cp"])descParts.push(`compleição ${d[cx+"cp"].toLowerCase()}`);
if(descParts.length)h+=para(`Tratava-se de cadáver de indivíduo com ${descParts.join(", ")}.`);
if(d[cx+"pos"])h+=para(`Encontrava-se em ${esc(d[cx+"pos"].toLowerCase())}.`);
h+=tblZ([d[cx+"fx"]?["Faixa etária",d[cx+"fx"]]:null,d[cx+"et"]?["Etnia",d[cx+"et"]]:null,d[cx+"sx"]?["Sexo",d[cx+"sx"]]:null,d[cx+"cp"]?["Compleição",d[cx+"cp"]]:null,d[cx+"pos"]?["Posição",d[cx+"pos"]]:null,d[cx+"dg"]?["Diagnóstico",d[cx+"dg"]]:null,d[cx+"le"]?["Local do evento",d[cx+"le"]]:null,d[cx+"ins"]?["Instrumento",Array.isArray(d[cx+"ins"])?d[cx+"ins"].join(", "):d[cx+"ins"]]:null,d[cx+"ins_o"]?["Outro instrumento",d[cx+"ins_o"]]:null,d[cx+"mom"]?["Momento",d[cx+"mom"]]:null]);
if(d[cx+"sui_tipo"]){h+=`<h5 style="font-size:12px;color:${PRIMARY};margin:10px 0 5px;font-weight:700">Meio de suicídio: ${esc(d[cx+"sui_tipo"])}</h5>`;if(d[cx+"sui_tipo"]==="Forca")h+=tblZ([d[cx+"forca_cad"]?["Cadáver na forca",d[cx+"forca_cad"]]:null,d[cx+"forca_susp"]?["Suspensão",d[cx+"forca_susp"]]:null,d[cx+"forca_inst"]?["Instrumento",d[cx+"forca_inst"]]:null,d[cx+"forca_anc"]?["Ancoragem",d[cx+"forca_anc"]]:null,d[cx+"forca_alt_anc"]?["Alt. ancoragem",d[cx+"forca_alt_anc"]]:null,d[cx+"forca_alt_no"]?["Alt. nó",d[cx+"forca_alt_no"]]:null,d[cx+"forca_alt_pesc"]?["Alt. pescoço",d[cx+"forca_alt_pesc"]]:null,d[cx+"forca_sulco"]?["Caract. sulco",Array.isArray(d[cx+"forca_sulco"])?d[cx+"forca_sulco"].join(", "):d[cx+"forca_sulco"]]:null,d[cx+"forca_achados"]?["Demais achados",Array.isArray(d[cx+"forca_achados"])?d[cx+"forca_achados"].join(", "):d[cx+"forca_achados"]]:null,d[cx+"forca_obs"]?["Obs",d[cx+"forca_obs"]]:null]);if(d[cx+"sui_tipo"]==="Arma de fogo")h+=tblZ([d[cx+"af_local"]?["Arma no local",d[cx+"af_local"]]:null,d[cx+"af_modelo"]?["Modelo",d[cx+"af_modelo"]]:null,d[cx+"af_serie"]?["Nº série",d[cx+"af_serie"]]:null,d[cx+"af_calibre"]?["Calibre",d[cx+"af_calibre"]]:null,d[cx+"af_sangue"]?["Sangue na arma",d[cx+"af_sangue"]]:null,d[cx+"af_obs"]?["Obs",d[cx+"af_obs"]]:null]);if(d[cx+"sui_tipo"]==="Arma branca")h+=tblZ([d[cx+"ab_local"]?["Arma no local",d[cx+"ab_local"]]:null,d[cx+"ab_cabo"]?["Cabo",d[cx+"ab_cabo"]]:null,d[cx+"ab_lamina"]?["Lâmina",d[cx+"ab_lamina"]]:null,d[cx+"ab_sangue"]?["Sangue lâmina",d[cx+"ab_sangue"]]:null,d[cx+"ab_obs"]?["Obs",d[cx+"ab_obs"]]:null]);if(d[cx+"sui_tipo"]==="Projeção")h+=tblZ([d[cx+"proj_alt"]?["Altura ao piso",d[cx+"proj_alt"]]:null,d[cx+"proj_local"]?["Local projeção",d[cx+"proj_local"]]:null,d[cx+"proj_alt_parapeito"]?["Alt. parapeito",d[cx+"proj_alt_parapeito"]]:null,d[cx+"proj_alt_apoio"]?["Alt. obj. apoio",d[cx+"proj_alt_apoio"]]:null,d[cx+"proj_obs"]?["Obs",d[cx+"proj_obs"]]:null]);if(d[cx+"sui_tipo"]==="Medicamento"&&d[cx+"meds"]){const meds=d[cx+"meds"].filter(m=>m.nome);if(meds.length)h+=tblList(meds,["Nº","Medicamento","Espaços vazios","Comprimidos","Obs"],(m,mi)=>{const fill=(mi%2===0)?ZEBRA:"#FFFFFF";return `<tr><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${LIGHT};text-align:center">${mi+1}</td><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(m.nome)}</td><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(m.vazios||"")}</td><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(m.comprimidos||"")}</td><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(m.obs||"")}</td></tr>`;});}if(d[cx+"sui_tipo"]==="Outro"&&d[cx+"sui_outro_obs"])h+=`<div style="padding:6px 10px;font-size:11px;background:#fff8e1;border:1px solid #ffe082"><b>Obs:</b> ${esc(d[cx+"sui_outro_obs"])}</div>`;}
// 4.3.2 Vestes e Pertences
// 4.3.2 Vestes e Pertences — só se houver vestes ou pertences cadastrados
const vestesC=vestes.filter(v=>v.tipo&&(v.cadaver===undefined||v.cadaver===ci));
if(vestesC.length||d[cx+"pert"]){h+=sec3(`${subCadBase}.2`,"Vestes e Pertences");if(vestesC.length)h+=tblList(vestesC,["Nº","Tipo/Marca","Cor","Sujidades","Sangue","Bolsos","Notas"],(v,idx2)=>{const fill=(idx2%2===0)?ZEBRA:"#FFFFFF";return `<tr><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${LIGHT};text-align:center">${idx2+1}</td><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(v.tipo)}</td><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(v.cor||"")}</td><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(v.sujidades||"")}</td><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(v.sangue||"")}</td><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(v.bolsos||"")}</td><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(v.notas||"")}</td></tr>`;});if(d[cx+"pert"])h+=tblZ([["Pertences",d[cx+"pert"]]]);}
// 4.3.3 Perinecroscopia
h+=sec3(`${subCadBase}.3`,"Perinecroscopia");
if(woundsC.length){h+=para(`Foram observadas ${woundsC.length} lesão(ões):`);h+=tblList(woundsC,["Nº","Região","Tipo","Características","Obs"],(w,idx)=>{const fill=(idx%2===0)?ZEBRA:"#FFFFFF";return `<tr><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${LIGHT};text-align:center">${idx+1}</td><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(w.regionLabel)}</td><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(w.tipo||"")}</td><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${w.caract&&w.caract.length?esc(w.caract.join(", ")):""}</td><td style="padding:4px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(w.obs||"")}</td></tr>`;});h+=bodyPdfSvg(woundsC);}
h+=`<h5 style="font-size:12px;color:${PRIMARY};margin:10px 0 5px;font-weight:700">Fenômenos cadavéricos</h5>`;
h+=tblZ([d[cx+"cu"]?["Cianose ungueais",d[cx+"cu"]]:null,d[cx+"cl"]?["Cianose labial",d[cx+"cl"]]:null,d[cx+"rm"]?["Rigidez mandíbula",d[cx+"rm"]]:null,d[cx+"rs"]?["Rigidez sup.",d[cx+"rs"]]:null,d[cx+"ri"]?["Rigidez inf.",d[cx+"ri"]]:null,d[cx+"lv"]?["Livores",d[cx+"lv"]]:null,d[cx+"lp"]?["Pos. livores",d[cx+"lp"]]:null,d[cx+"lc"]?["Compatível",d[cx+"lc"]]:null,d[cx+"sn"]?["Secr. nasal",d[cx+"sn"]]:null,d[cx+"so"]?["Secr. oral",d[cx+"so"]]:null,d[cx+"sg"]?["Peniana/vaginal",d[cx+"sg"]]:null,d[cx+"sa"]?["Anal",d[cx+"sa"]]:null,d[cx+"mva"]?["Mancha verde abd.",d[cx+"mva"]]:null,d[cx+"obs_peri"]?["Obs fenômenos",d[cx+"obs_peri"]]:null]);
if(d[cx+"avancado_decomp"]){h+=`<h4 style="font-size:12px;font-weight:700;color:#a02020;margin:14px 0 6px;text-transform:uppercase;letter-spacing:0.5px"><AppIcon name="☠️" size={14} mr={4}/>Decomposição Avançada — Achados</h4>`;h+=tblZ([(d[cx+"dec_abio"]||[]).length?["Abióticos / transformação",(d[cx+"dec_abio"]||[]).join(", ")]:null,(d[cx+"dec_fauna"]||[]).length?["Fauna cadavérica",(d[cx+"dec_fauna"]||[]).join(", ")]:null,(d[cx+"dec_cons"]||[]).length?["Conservação alternativa",(d[cx+"dec_cons"]||[]).join(", ")]:null,(d[cx+"dec_amb"]||[]).length?["Achados ambientais",(d[cx+"dec_amb"]||[]).join(", ")]:null,d[cx+"dec_obs"]?["Observações",d[cx+"dec_obs"]]:null]);}
// v234: 4.3.4 Observações gerais (livres)
if(d[cx+"obs_geral"]){h+=sec3(`${subCadBase}.4`,"Observações gerais");h+=para(esc(d[cx+"obs_geral"]));}
// 4.3.4 Exames de Medicina Legal — removido (informação complementada em laudo cadavérico específico)
}});
// --- 5 CADEIA DE CUSTÓDIA ---
const allVS=[...vestigios.filter(v=>v.desc),...canvasVest.filter(v=>v.desc).map(v=>({...v,desc:`[${v.placa}] ${v.desc}`}))];
const vsNR=allVS.filter(v=>v.recolhido!=="Sim");
const vsRC=allVS.filter(v=>v.recolhido==="Sim"&&!(v.destino||"").includes("II"));
const vsII=allVS.filter(v=>v.recolhido==="Sim"&&(v.destino||"").includes("II"));
const mkVeiSup=(vv)=>{const vi2=vv.veiculo??0;const vx2="v"+vi2+"_";const tm=d[vx2+"tipo"]||"";const vl=veiculos[vi2]?.label||"Veículo";return `${vl}${tm?" ("+tm+")":""} — ${vv.regionLabel}`;};
const vvIC2=veiVest.filter(vv=>vv.recolhido==="Sim"&&(vv.destino||"").includes("IC")).map(vv=>({desc:vv.tipo||vv.regionLabel,suporte:mkVeiSup(vv),obs:vv.obs}));
const vvII2=veiVest.filter(vv=>vv.recolhido==="Sim"&&(vv.destino||"").includes("II")).map(vv=>({desc:vv.tipo||vv.regionLabel,local:mkVeiSup(vv)}));
const allVestRecIC=[...vsRC,...vvIC2];
const papiloAll=[...vsII.map(v=>({desc:v.desc,local:supLoc(v),placa:""})),...vvII2,...papilos.filter(p=>p.desc)];
if(vsNR.length||allVestRecIC.length||papiloAll.length||d.obs_v||d.obs_p){h+=sec1("5","Cadeia de Custódia de Vestígios");h+=para("De modo a preservar o registro de todos os vestígios recolhidos por ocasião do exame de local, listam-se, a seguir, os elementos materiais coletados, acompanhados dos respectivos suportes e locais de coleta.");
if(vsNR.length){h+=`<h5 style="font-size:11px;color:${PRIMARY};margin:10px 0 4px;font-weight:700">Vestígios não recolhidos (documentados no local)</h5>`;h+=tblList(vsNR,["Nº","Descrição","Suporte / Localização"],(v,i)=>{const fill=(i%2===0)?ZEBRA:"#FFFFFF";return `<tr><td style="padding:5px 8px;font-size:11px;border:1px solid ${BORDER};background:${LIGHT};text-align:center;width:8%">${i+1}</td><td style="padding:5px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill};width:55%">${esc(v.desc+(v.obs?" — "+v.obs:""))}</td><td style="padding:5px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(supLoc(v))}</td></tr>`;});}
if(allVestRecIC.length){h+=`<h5 style="font-size:11px;color:${PRIMARY};margin:10px 0 4px;font-weight:700">Vestígios recolhidos — encaminhados ao Instituto de Criminalística</h5>`;h+=tblList(allVestRecIC,["Nº","Descrição","Suporte / Localização"],(v,i)=>{const fill=(i%2===0)?ZEBRA:"#FFFFFF";return `<tr><td style="padding:5px 8px;font-size:11px;border:1px solid ${BORDER};background:${LIGHT};text-align:center;width:8%">${i+1}</td><td style="padding:5px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill};width:55%">${esc(v.desc+(v.obs?" — "+v.obs:""))}</td><td style="padding:5px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(supLoc(v))}</td></tr>`;});}
if(papiloAll.length){h+=`<h5 style="font-size:11px;color:${PRIMARY};margin:10px 0 4px;font-weight:700">Vestígios recolhidos — encaminhados ao Instituto de Identificação (Papiloscopia)</h5>`;h+=tblList(papiloAll,["Nº","Descrição","Suporte / Localização"],(p,i)=>{const fill=(i%2===0)?ZEBRA:"#FFFFFF";return `<tr><td style="padding:5px 8px;font-size:11px;border:1px solid ${BORDER};background:${LIGHT};text-align:center;width:8%">${i+1}</td><td style="padding:5px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill};width:55%">${esc(p.desc)}</td><td style="padding:5px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(supPlaca(p.local,p.placa))}</td></tr>`;});}
if(d.obs_p)h+=`<div style="padding:6px 10px;font-size:11px;background:#fff8e1;border:1px solid #ffe082;margin-top:4px"><b>Obs papiloscopia:</b> ${esc(d.obs_p)}</div>`;
if(d.obs_v)h+=`<div style="padding:6px 10px;font-size:11px;background:#fff8e1;border:1px solid #ffe082;margin-top:4px"><b>Observações sobre os vestígios:</b> ${esc(d.obs_v)}</div>`;}
// --- 6 EXAMES CORRELATOS — removida (incluída em laudos específicos anexos) ---
// --- 7 ANÁLISE e 8 CONCLUSÃO — removidas (preenchidas manualmente pelos peritos no documento final) ---
// Encerramento
const encPerito=perito2?`relatado pelo(a) Perito(a) Criminal ${esc(perito1)}${matP1?" (mat. "+esc(matP1)+")":""} e revisado pelo(a) Perito(a) Criminal ${esc(perito2)}${matP2?" (mat. "+esc(matP2)+")":""}`:`relatado pelo(a) Perito(a) Criminal ${esc(perito1)}${matP1?" (mat. "+esc(matP1)+")":""}`;
h+=`<p style="font-size:11px;text-align:justify;text-indent:18px;margin:16px 0 8px;line-height:1.5">Nada mais havendo a lavrar, encerra-se o presente laudo, ${encPerito}, que segue assinado digitalmente.</p>`;
// --- FOTOGRAFIAS ---
if(fotos&&fotos.length){h+=`<div style="page-break-before:always"></div>`;h+=secCenter("Fotografias");fotos.forEach((f,i)=>{const legendaDesc=f.desc||f.name||"";const legendaLocal=f.local||"";const showLocal=legendaLocal&&!legendaDesc.includes(legendaLocal);const legendaTxt=`Fotografia ${i+1}${legendaDesc?" — "+esc(legendaDesc):""}${f.fase?" — "+esc(f.fase):""}${showLocal?" — "+esc(legendaLocal):""}`;h+=`<div style="margin:18px 0;text-align:center;page-break-inside:avoid"><img src="${f.dataUrl}" style="max-width:90%;max-height:450px;border:1px solid ${BORDER}"/><div style="font-size:11px;font-style:italic;color:#555;margin-top:6px">${legendaTxt}</div></div>`;});}
// --- CROQUI ---
if(imgRef.current){const allDrawKeys=Object.keys(imgRef.current).filter(k=>imgRef.current[k]);if(allDrawKeys.length>0){h+=`<div style="page-break-before:always"></div>`;h+=secCenter("Croqui"+(allDrawKeys.length>1?"s":"")+" do Local");allDrawKeys.forEach((dk,di)=>{const curImg=imgRef.current[dk];if(!curImg)return;const lbl=desenhos[+dk]?desenhos[+dk].label:("Croqui "+(+dk+1));h+=`<div style="margin:16px 0;text-align:center;page-break-inside:avoid"><img src="${curImg}" style="max-width:90%;max-height:600px;object-fit:contain;border:1px solid ${BORDER}"/><div style="font-size:11px;font-style:italic;color:#555;margin-top:6px">${esc(lbl)}</div></div>`;});}}
return h;};
  // ──────────────────────────────────────────
  // EXPORTAÇÃO — RRV (Registro de Recolhimento)
  // ──────────────────────────────────────────
const bRRV=()=>{const d=data;
// v242: redesenho com cores institucionais (igual ao Croqui)
const PRIMARY="#1A1A2E";const GOLD="#C9A961";const ZEBRA="#F5F5F7";const BORDER="#C8D6E5";const LIGHT="#E8E8EC";const ICBLUE="#1A4A7A";const IIORANGE="#B8741F";
// Vestígios normais recebem placa concatenada no suporte; canvasVest preserva placa no desc
const vestWithP=vestigios.map(v=>({...v,suporte:supLoc(v)}));
const allV2=[...vestWithP,...canvasVest.map(v=>({...v,desc:`[${v.placa}] ${v.desc}`,suporte:supLoc(v)}))];
const vr=allV2.filter(v=>v.desc&&(v.destino||"").includes("IC")&&v.recolhido!=="Não");
const vi2=allV2.filter(v=>v.desc&&(v.destino||"").includes("II")&&v.recolhido!=="Não");
const pr=papilos.filter(p=>p.desc);
// VeiVest → RRV
const mkVeiSupR=(vv)=>{const vi3=vv.veiculo??0;const vx2="v"+vi3+"_";const tm=d[vx2+"tipo"]||"";const vl=veiculos[vi3]?.label||"Veículo";return `${vl}${tm?" ("+tm+")":""} — ${vv.regionLabel}`;};
const vvIC=veiVest.filter(vv=>(vv.destino||"").includes("IC")&&vv.recolhido!=="Não").map(vv=>({desc:vv.tipo||vv.regionLabel,suporte:mkVeiSupR(vv)}));
const vvII=veiVest.filter(vv=>(vv.destino||"").includes("II")&&vv.recolhido!=="Não").map(vv=>({desc:vv.tipo||vv.regionLabel,suporte:mkVeiSupR(vv)}));
const dpResolvedRRV=d.dp==="Outro"?(d.dp_outro||""):(d.dp||"");
const natLbl=d.nat==="Outros"?(d.nat_outro||"—"):(d.nat||"—");
const ppNomeRRV=d.pp==="Outro"?(d.pp_outro||"___"):(d.pp||"___");
const totalIC=vr.length+vvIC.length;
const totalII=vi2.length+vvII.length+pr.length;
const totalGeral=totalIC+totalII;
let h="";
// === HEADER INSTITUCIONAL — idêntico ao Croqui ===
h+=`<div style="display:grid;grid-template-columns:70px 1fr 70px;align-items:center;border-bottom:2.5px solid ${GOLD};padding-bottom:8px;margin-bottom:12px">
<div style="text-align:center"><img src="data:image/jpeg;base64,${LOGO_PCDF_B64}" style="height:60px" alt="PCDF"/></div>
<div style="text-align:center;font-size:12px;font-weight:700;color:${PRIMARY};line-height:1.55">POLÍCIA CIVIL DO DISTRITO FEDERAL<br>DEPARTAMENTO DE POLÍCIA TÉCNICA<br>INSTITUTO DE CRIMINALÍSTICA<br>SEÇÃO DE CRIMES CONTRA A PESSOA</div>
<div style="text-align:center"><img src="data:image/jpeg;base64,${LOGO_DF_B64}" style="height:60px" alt="DF"/></div>
</div>`;
// === TÍTULO DO DOCUMENTO ===
h+=`<div style="text-align:center;margin:18px 0 8px">
<div style="font-size:22px;font-weight:700;color:${PRIMARY};letter-spacing:1px;line-height:1.3">REGISTRO DE RECOLHIMENTO DE VESTÍGIOS</div>
<div style="font-size:13px;font-weight:600;color:${GOLD};letter-spacing:2px;margin-top:4px">— RRV —</div>
<div style="font-size:10px;color:#666;margin-top:6px;font-style:italic">Conforme OS nº 01 do DPT, de 17/02/2014</div>
</div>`;
// === BLOCO IDENTIFICAÇÃO (dourado, mesmo do Croqui) ===
h+=`<table style="width:100%;border-collapse:collapse;border:1px solid ${GOLD};margin-bottom:14px">
<tr><td colspan="2" style="padding:7px 14px;font-weight:700;color:#fff;font-size:11.5px;background:${GOLD};letter-spacing:1px;text-transform:uppercase;border-bottom:1.5px solid #B89651">Identificação da Ocorrência</td></tr>
<tr><td style="padding:6px 14px;font-weight:700;color:#6B5326;width:32%;font-size:11px;background:#E8D9A8;border-bottom:1px solid #E8D9A8">Ocorrência / DP</td><td style="padding:6px 14px;font-size:11.5px;background:#FFFCEF;border-bottom:1px solid #E8D9A8">${esc(d.oc)||"___"}/${esc(d.oc_ano)||"____"} — ${esc(dpResolvedRRV)||"___"}</td></tr>
<tr><td style="padding:6px 14px;font-weight:700;color:#6B5326;width:32%;font-size:11px;background:#E8D9A8;border-bottom:1px solid #E8D9A8">Natureza</td><td style="padding:6px 14px;font-size:11.5px;background:#FFF8E8;border-bottom:1px solid #E8D9A8">${esc(natLbl)}</td></tr>
${d.end?`<tr><td style="padding:6px 14px;font-weight:700;color:#6B5326;width:32%;font-size:11px;background:#E8D9A8;border-bottom:1px solid #E8D9A8">Endereço</td><td style="padding:6px 14px;font-size:11.5px;background:#FFFCEF;border-bottom:1px solid #E8D9A8">${esc(d.end)}</td></tr>`:""}
<tr><td style="padding:6px 14px;font-weight:700;color:#6B5326;width:32%;font-size:11px;background:#E8D9A8;border-bottom:1px solid #E8D9A8">Data do atendimento</td><td style="padding:6px 14px;font-size:11.5px;background:#FFF8E8;border-bottom:1px solid #E8D9A8">${esc(d.dt_che)||new Date().toLocaleDateString(LOCALE)}</td></tr>
<tr><td style="padding:6px 14px;font-weight:700;color:#6B5326;width:32%;font-size:11px;background:#E8D9A8">Equipe</td><td style="padding:6px 14px;font-size:11.5px;background:#FFFCEF">Seção de Crimes Contra a Pessoa (SCPe)</td></tr>
</table>`;
// === CARDS DE TOTAIS (visual rápido) ===
h+=`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:18px">
<div style="background:linear-gradient(135deg,${ICBLUE} 0%,${ICBLUE}dd 100%);color:#fff;padding:12px;border-radius:8px;text-align:center"><div style="font-size:9px;font-weight:600;letter-spacing:1px;text-transform:uppercase;opacity:0.85">Inst. Criminalística</div><div style="font-size:24px;font-weight:800;line-height:1.1;margin-top:2px">${totalIC}</div><div style="font-size:9px;opacity:0.8;margin-top:1px">vestígio${totalIC!==1?"s":""}</div></div>
<div style="background:linear-gradient(135deg,${IIORANGE} 0%,${IIORANGE}dd 100%);color:#fff;padding:12px;border-radius:8px;text-align:center"><div style="font-size:9px;font-weight:600;letter-spacing:1px;text-transform:uppercase;opacity:0.85">Inst. Identificação</div><div style="font-size:24px;font-weight:800;line-height:1.1;margin-top:2px">${totalII}</div><div style="font-size:9px;opacity:0.8;margin-top:1px">vestígio${totalII!==1?"s":""}</div></div>
<div style="background:linear-gradient(135deg,${PRIMARY} 0%,${PRIMARY}ee 100%);color:#fff;padding:12px;border-radius:8px;text-align:center;border:1.5px solid ${GOLD}"><div style="font-size:9px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${GOLD}">Total Recolhido</div><div style="font-size:24px;font-weight:800;line-height:1.1;margin-top:2px">${totalGeral}</div><div style="font-size:9px;opacity:0.8;margin-top:1px">vestígio${totalGeral!==1?"s":""}</div></div>
</div>`;
// === TABELAS COLORIDAS — IC (azul) e II (laranja) ===
const mk=(items,title,dest,headColor,subtitle)=>{if(!items.length)return"";let t2=`<h3 style="font-size:13px;font-weight:700;color:${PRIMARY};margin:18px 0 4px;text-transform:uppercase;letter-spacing:0.4px;border-bottom:1.5px solid ${headColor};padding-bottom:4px;display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:10px;height:10px;background:${headColor};border-radius:2px"></span>${title} <span style="font-size:11px;font-weight:500;color:#888;margin-left:auto">${items.length} item${items.length>1?"s":""}</span></h3>`;
if(subtitle)t2+=`<p style="font-size:10px;color:#888;margin:0 0 6px;font-style:italic">${subtitle}</p>`;
t2+=`<table style="width:100%;border-collapse:collapse;border:1px solid ${BORDER};margin:0 0 8px;table-layout:fixed"><colgroup><col style="width:7%"/><col style="width:48%"/><col style="width:32%"/><col style="width:13%"/></colgroup>
<tr style="background:${headColor};color:#fff"><th style="padding:7px 8px;font-size:11px;border:1px solid ${headColor};text-align:center;font-weight:700">Nº</th><th style="padding:7px 8px;font-size:11px;border:1px solid ${headColor};text-align:left;font-weight:700">Vestígio</th><th style="padding:7px 8px;font-size:11px;border:1px solid ${headColor};text-align:left;font-weight:700">Suporte / Local</th><th style="padding:7px 8px;font-size:11px;border:1px solid ${headColor};text-align:center;font-weight:700">Destino</th></tr>`;
items.forEach((item,i)=>{const fill=(i%2===0)?ZEBRA:"#FFFFFF";t2+=`<tr style="page-break-inside:avoid"><td style="padding:5px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill};text-align:center;font-weight:700;color:${headColor}">${i+1}</td><td style="padding:5px 8px;font-size:11px;border:1px solid ${BORDER};background:${fill}">${esc(item.desc)}</td><td style="padding:5px 8px;font-size:10.5px;border:1px solid ${BORDER};background:${fill};color:#444">${esc(item.suporte||item.local||"")}</td><td style="padding:5px 8px;font-size:10.5px;border:1px solid ${BORDER};background:${fill};text-align:center;font-weight:600;color:${headColor}">${dest||item.destino||""}</td></tr>`;});
return t2+`</table>`;};
h+=mk([...vr,...vvIC],"Instituto de Criminalística (IC)","IC",ICBLUE,"Vestígios encaminhados para análise técnica laboratorial");
h+=mk([...vi2,...vvII,...pr.map(p=>({desc:p.desc,suporte:supPlaca(p.local,p.placa),destino:"II"}))],"Instituto de Identificação (II)","II",IIORANGE,"Vestígios encaminhados para confronto papiloscópico e identificação");
// === SE NÃO TEM NADA ===
if(totalGeral===0){h+=`<div style="text-align:center;padding:30px;background:${ZEBRA};border:1.5px dashed ${BORDER};border-radius:8px;margin:18px 0;color:#888;font-size:12px;font-style:italic">Nenhum vestígio com destino IC/II registrado nesta ocorrência.</div>`;}
// === ASSINATURAS — estilo elegante com bordas douradas ===
h+=`<div style="margin-top:46px;page-break-inside:avoid">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;font-size:11px;text-align:center">
<div><div style="border-bottom:1px solid ${PRIMARY};width:85%;margin:0 auto 8px;padding-top:50px"></div><b style="color:${PRIMARY};font-size:12px">${esc(d.p1)||"___"}</b><br><span style="color:#666">Perito Criminal</span><br><span style="font-size:10px;color:#888">Matrícula: ${esc(d.mat_p1)||"___"}</span></div>
<div><div style="border-bottom:1px solid ${PRIMARY};width:85%;margin:0 auto 8px;padding-top:50px"></div><b style="color:${PRIMARY};font-size:12px">${esc(ppNomeRRV)}</b><br><span style="color:#666">Papiloscopista Policial</span><br><span style="font-size:10px;color:#888">Matrícula: ${esc(d.mat_pp)||"___"}</span></div>
</div>
</div>`;
// === RODAPÉ INSTITUCIONAL ===
h+=`<div style="margin-top:30px;padding-top:8px;border-top:1.5px solid ${GOLD};text-align:center;font-size:9px;color:#888;letter-spacing:0.5px"><b style="color:${PRIMARY}">PCDF / DPT / IC / SCPe</b> · Documento gerado pelo Xandroid em ${fmtDt(new Date())}</div>`;
return h;};

// Body SVGs
  // ──────────────────────────────════════════
  // SVGs DO CORPO — Frente, Costas, Laterais
  // Usam imagens JPEG embutidas + Rg_ clicáveis
  // ══════════════════════════════════════════
const BF=()=>(<svg viewBox="0 0 292 650" style={{width:"100%",maxWidth:374}}>
<image href={BODY_F} x="0" y="0" width="292" height="625"/>
<text x="146" y="645" textAnchor="middle" fontSize="10" fontWeight="600" fill="#999">ANTERIOR</text>
<Rg_ id="f_cerv_ant" x={117} y={80} w={52} h={22} n="Pescoço" count={wc("f_cerv_ant")} onClick={aw}/>
<Rg_ id="f_supraclav_d" x={62} y={105} w={57} h={22} n="Ombro D" count={wc("f_supraclav_d")} onClick={aw}/>
<Rg_ id="f_supraclav_e" x={172} y={105} w={57} h={22} n="Ombro E" count={wc("f_supraclav_e")} onClick={aw}/>
<Rg_ id="f_esternal" x={117} y={127} w={55} h={70} n="Esterno" count={wc("f_esternal")} onClick={aw}/>
<Rg_ id="f_torac_d" x={62} y={127} w={55} h={37} n="Peito D" count={wc("f_torac_d")} onClick={aw}/>
<Rg_ id="f_torac_e" x={172} y={127} w={55} h={37} n="Peito E" count={wc("f_torac_e")} onClick={aw}/>
<Rg_ id="f_hipoc_d" x={60} y={165} w={57} h={35} n="Cost.D" count={wc("f_hipoc_d")} onClick={aw}/>
<Rg_ id="f_hipoc_e" x={172} y={165} w={57} h={35} n="Cost.E" count={wc("f_hipoc_e")} onClick={aw}/>
<Rg_ id="f_epigast" x={97} y={200} w={95} h={32} n="Epigástrica" count={wc("f_epigast")} onClick={aw}/>
<Rg_ id="f_flanco_d" x={52} y={200} w={45} h={32} n="Flanco D" count={wc("f_flanco_d")} onClick={aw}/>
<Rg_ id="f_flanco_e" x={192} y={200} w={45} h={32} n="Flanco E" count={wc("f_flanco_e")} onClick={aw}/>
<Rg_ id="f_mesogast" x={87} y={232} w={60} h={42} n="Abd. D" count={wc("f_mesogast")} onClick={aw}/>
<Rg_ id="f_hipogast" x={147} y={232} w={60} h={42} n="Abd. E" count={wc("f_hipogast")} onClick={aw}/>
<Rg_ id="f_pubiana" x={87} y={275} w={60} h={35} n="Púbis D" count={wc("f_pubiana")} onClick={aw}/>
<Rg_ id="f_genital" x={147} y={275} w={60} h={35} n="Gen. E" count={wc("f_genital")} onClick={aw}/>
<Rg_ id="f_braco_d" x={27} y={137} w={35} h={62} n="Braço D" count={wc("f_braco_d")} onClick={aw}/>
<Rg_ id="f_braco_e" x={227} y={137} w={35} h={62} n="Braço E" count={wc("f_braco_e")} onClick={aw}/>
<Rg_ id="f_cubital_d" x={17} y={200} w={35} h={27} n="Cot.D" count={wc("f_cubital_d")} onClick={aw}/>
<Rg_ id="f_cubital_e" x={240} y={200} w={35} h={27} n="Cot.E" count={wc("f_cubital_e")} onClick={aw}/>
<Rg_ id="f_antebr_d" x={5} y={227} w={37} h={75} n="Antbr.D" count={wc("f_antebr_d")} onClick={aw}/>
<Rg_ id="f_antebr_e" x={250} y={227} w={37} h={75} n="Antbr.E" count={wc("f_antebr_e")} onClick={aw}/>
<Rg_ id="f_coxa_d" x={82} y={327} w={60} h={80} n="Coxa D" count={wc("f_coxa_d")} onClick={aw}/>
<Rg_ id="f_coxa_e" x={147} y={327} w={60} h={80} n="Coxa E" count={wc("f_coxa_e")} onClick={aw}/>
<Rg_ id="f_joelho_d" x={90} y={422} w={50} h={30} n="Joel.D" count={wc("f_joelho_d")} onClick={aw}/>
<Rg_ id="f_joelho_e" x={152} y={422} w={50} h={30} n="Joel.E" count={wc("f_joelho_e")} onClick={aw}/>
<Rg_ id="f_perna_d" x={87} y={452} w={50} h={80} n="Perna D" count={wc("f_perna_d")} onClick={aw}/>
<Rg_ id="f_perna_e" x={152} y={452} w={50} h={80} n="Perna E" count={wc("f_perna_e")} onClick={aw}/>
</svg>);

  // ── COSTAS ──
const BB=()=>(<svg viewBox="0 0 288 650" style={{width:"100%",maxWidth:374}}>
<image href={BODY_B} x="0" y="0" width="288" height="625"/>
<text x="145" y="645" textAnchor="middle" fontSize="10" fontWeight="600" fill="#999">POSTERIOR</text>
<Rg_ id="b_cerv_post" x={110} y={72} w={50} h={25} n="Pescoço" count={wc("b_cerv_post")} onClick={aw}/>
<Rg_ id="b_deltoid_d" x={45} y={100} w={55} h={30} n="Ombro D" count={wc("b_deltoid_d")} onClick={aw}/>
<Rg_ id="b_deltoid_e" x={185} y={100} w={55} h={30} n="Ombro E" count={wc("b_deltoid_e")} onClick={aw}/>
<Rg_ id="b_escapular_d" x={55} y={130} w={67} h={47} n="Omplta D" count={wc("b_escapular_d")} onClick={aw}/>
<Rg_ id="b_escapular_e" x={162} y={130} w={67} h={47} n="Omplta E" count={wc("b_escapular_e")} onClick={aw}/>
<Rg_ id="b_dorsal" x={105} y={130} w={60} h={65} n="Costas" count={wc("b_dorsal")} onClick={aw}/>
<Rg_ id="b_lombar_d" x={70} y={195} w={65} h={40} n="Lomb.D" count={wc("b_lombar_d")} onClick={aw}/>
<Rg_ id="b_lombar_e" x={147} y={195} w={65} h={40} n="Lomb.E" count={wc("b_lombar_e")} onClick={aw}/>
<Rg_ id="b_sacro_d" x={80} y={237} w={57} h={32} n="Sacro D" count={wc("b_sacro_d")} onClick={aw}/>
<Rg_ id="b_sacro_e" x={147} y={237} w={57} h={32} n="Sacro E" count={wc("b_sacro_e")} onClick={aw}/>
<Rg_ id="b_glutea_d" x={67} y={270} w={67} h={50} n="Nádega D" count={wc("b_glutea_d")} onClick={aw}/>
<Rg_ id="b_glutea_e" x={147} y={270} w={67} h={50} n="Nádega E" count={wc("b_glutea_e")} onClick={aw}/>
<Rg_ id="b_braco_d" x={22} y={140} w={35} h={62} n="Braço D" count={wc("b_braco_d")} onClick={aw}/>
<Rg_ id="b_braco_e" x={230} y={140} w={35} h={62} n="Braço E" count={wc("b_braco_e")} onClick={aw}/>
<Rg_ id="b_antebr_d" x={5} y={217} w={35} h={75} n="Antbr.D" count={wc("b_antebr_d")} onClick={aw}/>
<Rg_ id="b_antebr_e" x={247} y={217} w={35} h={75} n="Antbr.E" count={wc("b_antebr_e")} onClick={aw}/>
<Rg_ id="b_coxa_d" x={82} y={332} w={60} h={75} n="Coxa D" count={wc("b_coxa_d")} onClick={aw}/>
<Rg_ id="b_coxa_e" x={147} y={332} w={60} h={75} n="Coxa E" count={wc("b_coxa_e")} onClick={aw}/>
<Rg_ id="b_perna_d" x={85} y={432} w={55} h={80} n="Pantr.D" count={wc("b_perna_d")} onClick={aw}/>
<Rg_ id="b_perna_e" x={150} y={432} w={55} h={80} n="Pantr.E" count={wc("b_perna_e")} onClick={aw}/>
</svg>);

  // ── LATERAIS (esquerdo + direito) ──
const BLat=()=>(<div style={{display:"flex",gap:8,justifyContent:"center",width:"100%"}}>
<svg viewBox="0 0 186 650" style={{width:"48%",maxWidth:259}}>
<image href={BODY_R} x="0" y="0" width="186" height="625"/>
<text x="93" y="645" textAnchor="middle" fontSize="9" fontWeight="600" fill="#999">DIREITO</text>
<Rg_ id="h_temporal_d" x={37} y={12} w={87} h={50} n="Cabeça" count={wc("h_temporal_d")} onClick={aw}/>
<Rg_ id="f_cerv_ant" x={37} y={70} w={75} h={32} n="Pescoço" count={wc("f_cerv_ant")} onClick={aw}/>
<Rg_ id="f_supraclav_d" x={22} y={105} w={62} h={30} n="Ombro" count={wc("f_supraclav_d")} onClick={aw}/>
<Rg_ id="f_torac_d" x={22} y={135} w={87} h={37} n="Tórax" count={wc("f_torac_d")} onClick={aw}/>
<Rg_ id="f_braco_d" x={95} y={135} w={60} h={60} n="Braço" count={wc("f_braco_d")} onClick={aw}/>
<Rg_ id="f_hipoc_d" x={22} y={172} w={87} h={35} n="Costelas" count={wc("f_hipoc_d")} onClick={aw}/>
<Rg_ id="f_flanco_d" x={22} y={207} w={87} h={35} n="Flanco" count={wc("f_flanco_d")} onClick={aw}/>
<Rg_ id="f_antebr_d" x={87} y={200} w={62} h={67} n="Antebraço" count={wc("f_antebr_d")} onClick={aw}/>
<Rg_ id="f_mesogast" x={27} y={242} w={82} h={40} n="Abdômen" count={wc("f_mesogast")} onClick={aw}/>
<Rg_ id="b_glutea_d" x={27} y={282} w={82} h={45} n="Quadril" count={wc("b_glutea_d")} onClick={aw}/>
<Rg_ id="f_coxa_d" x={37} y={332} w={75} h={75} n="Coxa" count={wc("f_coxa_d")} onClick={aw}/>
<Rg_ id="f_joelho_d" x={45} y={422} w={67} h={32} n="Joelho" count={wc("f_joelho_d")} onClick={aw}/>
<Rg_ id="f_perna_d" x={42} y={455} w={70} h={75} n="Perna" count={wc("f_perna_d")} onClick={aw}/>
</svg>
<svg viewBox="0 0 178 650" style={{width:"48%",maxWidth:259}}>
<image href={BODY_L} x="0" y="0" width="178" height="625"/>
<text x="90" y="645" textAnchor="middle" fontSize="9" fontWeight="600" fill="#999">ESQUERDO</text>
<Rg_ id="h_temporal_e" x={35} y={12} w={87} h={50} n="Cabeça" count={wc("h_temporal_e")} onClick={aw}/>
<Rg_ id="f_cerv_ant" x={42} y={70} w={75} h={32} n="Pescoço" count={wc("f_cerv_ant")} onClick={aw}/>
<Rg_ id="f_supraclav_e" x={47} y={105} w={62} h={30} n="Ombro" count={wc("f_supraclav_e")} onClick={aw}/>
<Rg_ id="f_torac_e" x={35} y={135} w={87} h={37} n="Tórax" count={wc("f_torac_e")} onClick={aw}/>
<Rg_ id="f_braco_e" x={5} y={135} w={60} h={60} n="Braço" count={wc("f_braco_e")} onClick={aw}/>
<Rg_ id="f_hipoc_e" x={27} y={172} w={87} h={35} n="Costelas" count={wc("f_hipoc_e")} onClick={aw}/>
<Rg_ id="f_flanco_e" x={20} y={207} w={87} h={35} n="Flanco" count={wc("f_flanco_e")} onClick={aw}/>
<Rg_ id="f_antebr_e" x={2} y={200} w={62} h={67} n="Antebraço" count={wc("f_antebr_e")} onClick={aw}/>
<Rg_ id="f_hipogast" x={25} y={242} w={82} h={40} n="Abdômen" count={wc("f_hipogast")} onClick={aw}/>
<Rg_ id="b_glutea_e" x={25} y={282} w={82} h={45} n="Quadril" count={wc("b_glutea_e")} onClick={aw}/>
<Rg_ id="f_coxa_e" x={32} y={332} w={75} h={75} n="Coxa" count={wc("f_coxa_e")} onClick={aw}/>
<Rg_ id="f_joelho_e" x={50} y={422} w={67} h={32} n="Joelho" count={wc("f_joelho_e")} onClick={aw}/>
<Rg_ id="f_perna_e" x={47} y={455} w={70} h={75} n="Perna" count={wc("f_perna_e")} onClick={aw}/>
</svg></div>);
  // ══════════════════════════════════════════
  // SVGs DA CABEÇA — 4 vistas com imagens
  // Frente, Atrás, Perfil E, Perfil D
  // ══════════════════════════════════════════
const HS=()=>(<div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",width:"100%"}}>
{/* FRONT */}
<svg viewBox="0 0 200 220" style={{width:"48%",minWidth:161,maxWidth:207}}>
<image href={HEAD_F} x="0" y="0" width="200" height="200"/>
<text x="100" y="216" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">FRENTE</text>
<Rg_ id="h_frontal" x={55} y={10} w={90} h={38} n="Testa" count={wc("h_frontal")} onClick={aw}/>
<Rg_ id="h_orbit_d" x={52} y={50} w={42} h={24} n="Olho D" count={wc("h_orbit_d")} onClick={aw}/>
<Rg_ id="h_orbit_e" x={106} y={50} w={42} h={24} n="Olho E" count={wc("h_orbit_e")} onClick={aw}/>
<Rg_ id="h_nasal" x={80} y={76} w={40} h={28} n="Nariz" count={wc("h_nasal")} onClick={aw}/>
<Rg_ id="h_labial_sup" x={70} y={106} w={60} h={14} n="L.sup" count={wc("h_labial_sup")} onClick={aw}/>
<Rg_ id="h_labial_inf" x={70} y={120} w={60} h={14} n="L.inf" count={wc("h_labial_inf")} onClick={aw}/>
<Rg_ id="h_mentoniana" x={72} y={136} w={56} h={22} n="Queixo" count={wc("h_mentoniana")} onClick={aw}/>
</svg>
{/* BACK */}
<svg viewBox="0 0 200 220" style={{width:"48%",minWidth:161,maxWidth:207}}>
<image href={HEAD_B} x="0" y="0" width="200" height="200"/>
<text x="100" y="216" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">ATRÁS</text>
<Rg_ id="h_parietal_d" x={40} y={8} w={60} h={50} n="Par.D" count={wc("h_parietal_d")} onClick={aw}/>
<Rg_ id="h_parietal_e" x={100} y={8} w={60} h={50} n="Par.E" count={wc("h_parietal_e")} onClick={aw}/>
<Rg_ id="h_vertex" x={55} y={6} w={90} h={40} n="Vértex" count={wc("h_vertex")} onClick={aw}/>
<Rg_ id="h_occipital" x={50} y={56} w={100} h={60} n="Occip." count={wc("h_occipital")} onClick={aw}/>
<Rg_ id="h_auricular_d" x={36} y={80} w={24} h={36} n="Or.D" count={wc("h_auricular_d")} onClick={aw}/>
<Rg_ id="h_auricular_e" x={140} y={80} w={24} h={36} n="Or.E" count={wc("h_auricular_e")} onClick={aw}/>
</svg>
{/* LEFT PROFILE */}
<svg viewBox="0 0 200 220" style={{width:"48%",minWidth:161,maxWidth:207}}>
<image href={HEAD_L} x="0" y="0" width="200" height="200"/>
<text x="100" y="216" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">ESQUERDO</text>
<Rg_ id="h_temporal_e" x={40} y={10} w={80} h={50} n="Temp.E" count={wc("h_temporal_e")} onClick={aw}/>
<Rg_ id="h_auricular_e" x={120} y={68} w={36} h={44} n="Orelha E" count={wc("h_auricular_e")} onClick={aw}/>
<Rg_ id="h_occipital" x={110} y={16} w={56} h={50} n="Occ." count={wc("h_occipital")} onClick={aw}/>
</svg>
{/* RIGHT PROFILE */}
<svg viewBox="0 0 200 220" style={{width:"48%",minWidth:161,maxWidth:207}}>
<image href={HEAD_R} x="0" y="0" width="200" height="200"/>
<text x="100" y="216" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">DIREITO</text>
<Rg_ id="h_temporal_d" x={80} y={10} w={80} h={50} n="Temp.D" count={wc("h_temporal_d")} onClick={aw}/>
<Rg_ id="h_auricular_d" x={44} y={68} w={36} h={44} n="Orelha D" count={wc("h_auricular_d")} onClick={aw}/>
<Rg_ id="h_occipital" x={34} y={16} w={56} h={50} n="Occ." count={wc("h_occipital")} onClick={aw}/>
</svg>
</div>)
  // ══════════════════════════════════════════
  // SVGs DAS MÃOS — Palma e Dorso (D e E)
  // Mão E espelhada via scaleX(-1)
  // ══════════════════════════════════════════
const MSvg=({side})=>{const p=side==="D"?"md":"me";const isLeft=side==="E";return(<div style={{display:"flex",gap:8,justifyContent:"center",width:"100%",transform:isLeft?"scaleX(-1)":"none"}}>
<svg viewBox="0 0 140 200" style={{width:"48%",maxWidth:161}}>
<defs><linearGradient id={"gH1"+side} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ede4da" stopOpacity="0.15"/><stop offset="100%" stopColor="#ddd0c0" stopOpacity="0.08"/></linearGradient></defs>
<path d="M40 160 L35 120 Q34 100 45 90 L55 82 Q70 78 85 82 L95 90 Q106 100 105 120 L100 160Z" fill={"url(#gH1"+side+")"} stroke="#999" strokeWidth="0.6"/>
<rect x="40" y="160" width="60" height="30" rx="8" fill={"url(#gH1"+side+")"} stroke="#999" strokeWidth="0.5"/>
<path d="M48 82 L46 20 Q48 14 52 14 Q56 14 58 20 L58 82" fill="none" stroke="#999" strokeWidth="0.5"/>
<path d="M60 80 L60 10 Q62 4 66 4 Q70 4 72 10 L72 80" fill="none" stroke="#999" strokeWidth="0.5"/>
<path d="M74 82 L76 18 Q78 12 82 12 Q86 12 84 18 L82 82" fill="none" stroke="#999" strokeWidth="0.5"/>
<path d="M86 88 L90 34 Q92 28 96 28 Q100 28 98 34 L96 88" fill="none" stroke="#999" strokeWidth="0.5"/>
<path d="M35 120 L22 100 Q16 90 18 80 L22 70 Q26 64 32 62 Q36 62 38 66 L42 80" fill="none" stroke="#999" strokeWidth="0.5"/>

<Rg_ id={p+"_palma"} x={38} y={90} w={64} h={70} n="Palma" count={wc(p+"_palma")} onClick={aw}/>
<Rg_ id={p+"_polegar"} x={16} y={60} w={24} h={42} n="Pol" count={wc(p+"_polegar")} onClick={aw}/>
<Rg_ id={p+"_indicador"} x={40} y={14} w={20} h={68} n="Ind" count={wc(p+"_indicador")} onClick={aw}/>
<Rg_ id={p+"_medio"} x={56} y={4} w={20} h={76} n="Med" count={wc(p+"_medio")} onClick={aw}/>
<Rg_ id={p+"_anelar"} x={72} y={12} w={16} h={70} n="Ane" count={wc(p+"_anelar")} onClick={aw}/>
<Rg_ id={p+"_minimo"} x={86} y={28} w={16} h={62} n="Min" count={wc(p+"_minimo")} onClick={aw}/>
<Rg_ id={p+"_punho"} x={40} y={160} w={60} h={30} n="Punho" count={wc(p+"_punho")} onClick={aw}/>
<g transform={isLeft?"translate(140,0) scale(-1,1)":""}><text x="70" y="198" textAnchor="middle" fontSize="7" fontWeight="600" fill="#aaa">PALMA {side}</text></g>
</svg>
<svg viewBox="0 0 140 200" style={{width:"48%",maxWidth:161}}>
<path d="M40 160 L35 120 Q34 100 45 90 L55 82 Q70 78 85 82 L95 90 Q106 100 105 120 L100 160Z" fill={"url(#gH1"+side+")"} stroke="#999" strokeWidth="0.6"/>
<rect x="40" y="160" width="60" height="30" rx="8" fill={"url(#gH1"+side+")"} stroke="#999" strokeWidth="0.5"/>
<path d="M48 82 L46 20 Q48 14 52 14 Q56 14 58 20 L58 82" fill="none" stroke="#999" strokeWidth="0.5"/>
<path d="M60 80 L60 10 Q62 4 66 4 Q70 4 72 10 L72 80" fill="none" stroke="#999" strokeWidth="0.5"/>
<path d="M74 82 L76 18 Q78 12 82 12 Q86 12 84 18 L82 82" fill="none" stroke="#999" strokeWidth="0.5"/>
<path d="M86 88 L90 34 Q92 28 96 28 Q100 28 98 34 L96 88" fill="none" stroke="#999" strokeWidth="0.5"/>
<path d="M35 120 L22 100 Q16 90 18 80 L22 70 Q26 64 32 62 Q36 62 38 66 L42 80" fill="none" stroke="#999" strokeWidth="0.5"/>
<line x1="70" y1="85" x2="70" y2="160" stroke="#ddd" strokeWidth="0.2" strokeDasharray="2 3"/>

<Rg_ id={p+"_dorso"} x={38} y={90} w={64} h={70} n="Dorso" count={wc(p+"_dorso")} onClick={aw}/>
<Rg_ id={p+"_polegar"} x={16} y={60} w={24} h={42} n="Pol" count={wc(p+"_polegar")} onClick={aw}/>
<Rg_ id={p+"_indicador"} x={40} y={14} w={20} h={68} n="Ind" count={wc(p+"_indicador")} onClick={aw}/>
<Rg_ id={p+"_medio"} x={56} y={4} w={20} h={76} n="Med" count={wc(p+"_medio")} onClick={aw}/>
<Rg_ id={p+"_anelar"} x={72} y={12} w={16} h={70} n="Ane" count={wc(p+"_anelar")} onClick={aw}/>
<Rg_ id={p+"_minimo"} x={86} y={28} w={16} h={62} n="Min" count={wc(p+"_minimo")} onClick={aw}/>
<Rg_ id={p+"_punho"} x={40} y={160} w={60} h={30} n="Punho" count={wc(p+"_punho")} onClick={aw}/>
<g transform={isLeft?"translate(140,0) scale(-1,1)":""}><text x="70" y="198" textAnchor="middle" fontSize="7" fontWeight="600" fill="#aaa">DORSO {side}</text></g>
</svg></div>);};

  // ══════════════════════════════════════════
  // SVGs DOS PÉS — Planta e Dorso (D e E)
  // ══════════════════════════════════════════
const FootSvg=({side})=>{const p=side==="D"?"pd":"pe";return(<div style={{display:"flex",gap:8,justifyContent:"center",width:"100%"}}>
<svg viewBox="0 0 140 220" style={{width:"48%",maxWidth:161}}>
<defs><linearGradient id={"gFtD"+side} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ede4da" stopOpacity="0.15"/><stop offset="100%" stopColor="#ddd0c0" stopOpacity="0.08"/></linearGradient></defs>
<rect x="45" y="0" width="50" height="30" rx="10" fill={"url(#gFtD"+side+")"} stroke="#999" strokeWidth="0.5"/>
<path d="M40 30 Q30 50 28 80 Q26 110 30 140 Q32 160 40 170 Q50 178 60 180 L80 180 Q100 178 108 168 Q114 155 112 140 Q110 110 108 80 Q106 50 100 30Z" fill={"url(#gFtD"+side+")"} stroke="#999" strokeWidth="0.6"/>
<path d="M50 50 Q70 42 90 50" fill="none" stroke="#ddd" strokeWidth="0.3"/>
<line x1="70" y1="40" x2="70" y2="170" stroke="#eee" strokeWidth="0.15" strokeDasharray="2 3"/>
<ellipse cx="48" cy="184" rx="10" ry="8" fill={"url(#gFtD"+side+")"} stroke="#999" strokeWidth="0.4"/>
<ellipse cx="65" cy="188" rx="7" ry="7" fill={"url(#gFtD"+side+")"} stroke="#999" strokeWidth="0.4"/>
<ellipse cx="78" cy="187" rx="6" ry="6" fill={"url(#gFtD"+side+")"} stroke="#999" strokeWidth="0.4"/>
<ellipse cx="89" cy="184" rx="6" ry="6" fill={"url(#gFtD"+side+")"} stroke="#999" strokeWidth="0.4"/>
<ellipse cx="99" cy="179" rx="5" ry="5" fill={"url(#gFtD"+side+")"} stroke="#999" strokeWidth="0.4"/>
<text x="70" y="210" textAnchor="middle" fontSize="7" fontWeight="600" fill="#aaa">DORSO {side}</text>
<Rg_ id={p+"_dorso"} x={32} y={50} w={76} h={90} n="Dorso" count={wc(p+"_dorso")} onClick={aw}/>
<Rg_ id={p+"_calcanhar"} x={42} y={140} w={56} h={38} n="Calcanh." count={wc(p+"_calcanhar")} onClick={aw}/>
<Rg_ id={p+"_tornoz"} x={45} y={0} w={50} h={30} n="Tornoz." count={wc(p+"_tornoz")} onClick={aw}/>
<Rg_ id={p+"_dedao"} x={38} y={176} w={20} h={16} n="Dedão" count={wc(p+"_dedao")} onClick={aw}/>
<Rg_ id={p+"_2dedo"} x={58} y={181} w={14} h={14} n="2º" count={wc(p+"_2dedo")} onClick={aw}/>
<Rg_ id={p+"_3dedo"} x={72} y={181} w={12} h={12} n="3º" count={wc(p+"_3dedo")} onClick={aw}/>
<Rg_ id={p+"_4dedo"} x={83} y={178} w={12} h={12} n="4º" count={wc(p+"_4dedo")} onClick={aw}/>
<Rg_ id={p+"_mindinho"} x={94} y={174} w={10} h={10} n="5º" count={wc(p+"_mindinho")} onClick={aw}/>
</svg>
<svg viewBox="0 0 140 220" style={{width:"48%",maxWidth:161}}>
<rect x="45" y="0" width="50" height="30" rx="10" fill={"url(#gFtD"+side+")"} stroke="#999" strokeWidth="0.5"/>
<path d="M40 30 Q30 50 28 80 Q26 110 30 140 Q32 160 40 170 Q50 178 60 180 L80 180 Q100 178 108 168 Q114 155 112 140 Q110 110 108 80 Q106 50 100 30Z" fill={"url(#gFtD"+side+")"} stroke="#999" strokeWidth="0.6"/>
<path d="M42 60 Q70 50 98 60" fill="none" stroke="#ddd" strokeWidth="0.3"/>
<path d="M38 100 Q70 90 102 100" fill="none" stroke="#ddd" strokeWidth="0.3"/>
<path d="M40 140 Q70 132 100 140" fill="none" stroke="#ddd" strokeWidth="0.3"/>
<ellipse cx="48" cy="184" rx="10" ry="8" fill={"url(#gFtD"+side+")"} stroke="#999" strokeWidth="0.4"/>
<ellipse cx="65" cy="188" rx="7" ry="7" fill={"url(#gFtD"+side+")"} stroke="#999" strokeWidth="0.4"/>
<ellipse cx="78" cy="187" rx="6" ry="6" fill={"url(#gFtD"+side+")"} stroke="#999" strokeWidth="0.4"/>
<ellipse cx="89" cy="184" rx="6" ry="6" fill={"url(#gFtD"+side+")"} stroke="#999" strokeWidth="0.4"/>
<ellipse cx="99" cy="179" rx="5" ry="5" fill={"url(#gFtD"+side+")"} stroke="#999" strokeWidth="0.4"/>
<text x="70" y="210" textAnchor="middle" fontSize="7" fontWeight="600" fill="#aaa">PLANTA {side}</text>
<Rg_ id={p+"_planta"} x={32} y={50} w={76} h={90} n="Planta" count={wc(p+"_planta")} onClick={aw}/>
<Rg_ id={p+"_pl_calcanhar"} x={42} y={140} w={56} h={38} n="Calcanh." count={wc(p+"_pl_calcanhar")} onClick={aw}/>
<Rg_ id={p+"_pl_tornoz"} x={45} y={0} w={50} h={30} n="Tornoz." count={wc(p+"_pl_tornoz")} onClick={aw}/>
<Rg_ id={p+"_pl_dedao"} x={38} y={176} w={20} h={16} n="Dedão" count={wc(p+"_pl_dedao")} onClick={aw}/>
<Rg_ id={p+"_pl_2dedo"} x={58} y={181} w={14} h={14} n="2º" count={wc(p+"_pl_2dedo")} onClick={aw}/>
<Rg_ id={p+"_pl_3dedo"} x={72} y={181} w={12} h={12} n="3º" count={wc(p+"_pl_3dedo")} onClick={aw}/>
<Rg_ id={p+"_pl_4dedo"} x={83} y={178} w={12} h={12} n="4º" count={wc(p+"_pl_4dedo")} onClick={aw}/>
<Rg_ id={p+"_pl_mindinho"} x={94} y={174} w={10} h={10} n="5º" count={wc(p+"_pl_mindinho")} onClick={aw}/>
</svg></div>);};
  // ══════════════════════════════════════════
  // SVGs DOS VEÍCULOS — Carro, Moto, Bici, Caminhão, Ônibus
  // Cada veículo tem vistas e regiões VRg clicáveis
  // ══════════════════════════════════════════

// Vehicle SVGs — Carro (17 regiões/lateral, 9 frente, 8 traseira, 4 teto, 20 interior = 75 total)
const VLatSvg=({side})=>{const R=side==="E"?RVE:RVD;const label=side==="E"?"LATERAL ESQUERDA":"LATERAL DIREITA";return(<svg viewBox="0 0 540 240" style={{width:"100%"}}>
{/* Car body */}
<path d="M55 148 L78 148 L105 78 Q118 58 158 50 L382 50 Q422 58 435 78 L462 148 L485 148 Q498 148 498 156 L498 170 Q498 178 485 178 L55 178 Q42 178 42 170 L42 156 Q42 148 55 148Z" fill="none" stroke="#555" strokeWidth="1.2"/>
{/* Windows */}
<path d="M158 50 L150 30 Q158 16 212 12 L328 12 Q382 16 390 30 L382 50" fill="none" stroke="#555" strokeWidth="0.8"/>
<path d="M164 50 L156 34 Q170 20 216 17 L264 17 L264 50Z" fill="none" stroke="#555" strokeWidth="0.5"/>
<path d="M276 50 L276 17 L324 17 Q370 20 384 34 L376 50Z" fill="none" stroke="#555" strokeWidth="0.5"/>
{/* B-pillar */}
<line x1="270" y1="50" x2="270" y2="148" stroke="#555" strokeWidth="0.6"/>
{/* Bumpers */}
<path d="M42 148 L55 148 L58 140 L42 140Z" fill="none" stroke="#555" strokeWidth="0.5"/>
<path d="M485 148 L498 148 L498 140 L482 140Z" fill="none" stroke="#555" strokeWidth="0.5"/>
{/* Wheels */}
<circle cx="138" cy="172" r="26" fill="none" stroke="#555" strokeWidth="1.2"/><circle cx="138" cy="172" r="16" fill="none" stroke="#555" strokeWidth="0.5"/>
<circle cx="402" cy="172" r="26" fill="none" stroke="#555" strokeWidth="1.2"/><circle cx="402" cy="172" r="16" fill="none" stroke="#555" strokeWidth="0.5"/>
<text x="270" y="230" textAnchor="middle" fontSize="9" fontWeight="600" fill="#888">{label}</text>
{/* Doors */}
<VRg id={R[0].id} x={170} y={52} w={95} h={94} n="Porta ant." count={vwc(R[0].id)} onClick={addVV}/>
<VRg id={R[1].id} x={276} y={52} w={95} h={94} n="Porta pos." count={vwc(R[1].id)} onClick={addVV}/>
{/* Windows */}
<VRg id={R[2].id} x={166} y={18} w={95} h={30} n="Vidro ant." count={vwc(R[2].id)} onClick={addVV}/>
<VRg id={R[3].id} x={279} y={18} w={95} h={30} n="Vidro pos." count={vwc(R[3].id)} onClick={addVV}/>
{/* Mirror */}
<VRg id={R[4].id} x={92} y={50} w={28} h={24} n="Retrov." count={vwc(R[4].id)} onClick={addVV}/>
{/* Fenders */}
<VRg id={R[5].id} x={55} y={74} w={68} h={56} n="P-lama ant." count={vwc(R[5].id)} onClick={addVV}/>
<VRg id={R[6].id} x={416} y={74} w={68} h={56} n="P-lama pos." count={vwc(R[6].id)} onClick={addVV}/>
{/* Bumpers */}
<VRg id={R[7].id} x={42} y={132} w={50} h={20} n="P-chq ant." count={vwc(R[7].id)} onClick={addVV}/>
<VRg id={R[8].id} x={448} y={132} w={50} h={20} n="P-chq pos." count={vwc(R[8].id)} onClick={addVV}/>
{/* Wheels (rim) */}
<VRg id={R[9].id} x={122} y={156} w={32} h={24} n="Roda ant." count={vwc(R[9].id)} onClick={addVV}/>
<VRg id={R[10].id} x={386} y={156} w={32} h={24} n="Roda pos." count={vwc(R[10].id)} onClick={addVV}/>
{/* Tires */}
<VRg id={R[11].id} x={110} y={148} w={56} h={18} n="Pneu ant." count={vwc(R[11].id)} onClick={addVV}/>
<VRg id={R[12].id} x={374} y={148} w={56} h={18} n="Pneu pos." count={vwc(R[12].id)} onClick={addVV}/>
{/* Sill */}
<VRg id={R[13].id} x={175} y={148} w={190} h={16} n="Soleira" count={vwc(R[13].id)} onClick={addVV}/>
{/* Pillars */}
<VRg id={R[14].id} x={108} y={26} w={20} h={54} n="Col.A" count={vwc(R[14].id)} onClick={addVV}/>
<VRg id={R[15].id} x={262} y={14} w={18} h={54} n="Col.B" count={vwc(R[15].id)} onClick={addVV}/>
<VRg id={R[16].id} x={376} y={26} w={20} h={54} n="Col.C" count={vwc(R[16].id)} onClick={addVV}/>
</svg>);};

const VFrenteSvg=()=>(<svg viewBox="0 0 320 260" style={{width:"100%"}}>
<path d="M52 180 L52 106 Q52 68 80 54 L106 40 Q160 26 214 40 L240 54 Q268 68 268 106 L268 180 Q268 200 254 206 L66 206 Q52 200 52 180Z" fill="none" stroke="#555" strokeWidth="1"/>
<path d="M88 60 Q160 36 232 60 L226 98 Q160 84 94 98Z" fill="none" stroke="#555" strokeWidth="0.6"/>
<rect x="66" y="118" width="42" height="28" rx="5" fill="none" stroke="#555" strokeWidth="0.5"/>
<rect x="212" y="118" width="42" height="28" rx="5" fill="none" stroke="#555" strokeWidth="0.5"/>
<text x="160" y="248" textAnchor="middle" fontSize="9" fontWeight="600" fill="#888">FRENTE</text>
<VRg id="ve_parabrisa" x={82} y={36} w={156} h={26} n="Para-brisa diant." count={vwc("ve_parabrisa")} onClick={addVV}/>
<VRg id="ve_capo" x={72} y={62} w={176} h={44} n="Capô" count={vwc("ve_capo")} onClick={addVV}/>
<VRg id="ve_farol_e" x={58} y={114} w={54} h={34} n="Farol E" count={vwc("ve_farol_e")} onClick={addVV}/>
<VRg id="ve_farol_d" x={208} y={114} w={54} h={34} n="Farol D" count={vwc("ve_farol_d")} onClick={addVV}/>
<VRg id="ve_grade" x={112} y={114} w={96} h={34} n="Grade frontal" count={vwc("ve_grade")} onClick={addVV}/>
<VRg id="ve_parachoque_d_e" x={54} y={172} w={70} h={22} n="P-chq diant. E" count={vwc("ve_parachoque_d_e")} onClick={addVV}/>
<VRg id="ve_parachoque_d_c" x={126} y={172} w={68} h={22} n="P-chq diant. C" count={vwc("ve_parachoque_d_c")} onClick={addVV}/>
<VRg id="ve_parachoque_d_d" x={196} y={172} w={70} h={22} n="P-chq diant. D" count={vwc("ve_parachoque_d_d")} onClick={addVV}/>
<VRg id="ve_placa_d" x={112} y={196} w={96} h={14} n="Placa dianteira" count={vwc("ve_placa_d")} onClick={addVV}/>
</svg>);

const VTrasSvg=()=>(<svg viewBox="0 0 320 260" style={{width:"100%"}}>
<path d="M52 180 L52 106 Q52 68 80 54 L106 40 Q160 26 214 40 L240 54 Q268 68 268 106 L268 180 Q268 200 254 206 L66 206 Q52 200 52 180Z" fill="none" stroke="#555" strokeWidth="1"/>
<path d="M88 60 Q160 36 232 60 L226 92 Q160 80 94 92Z" fill="none" stroke="#555" strokeWidth="0.6"/>
<rect x="66" y="118" width="36" height="24" rx="4" fill="none" stroke="#555" strokeWidth="0.5"/>
<rect x="218" y="118" width="36" height="24" rx="4" fill="none" stroke="#555" strokeWidth="0.5"/>
<text x="160" y="248" textAnchor="middle" fontSize="9" fontWeight="600" fill="#888">TRASEIRA</text>
<VRg id="ve_vidro_tras" x={82} y={36} w={156} h={26} n="Vidro traseiro" count={vwc("ve_vidro_tras")} onClick={addVV}/>
<VRg id="ve_portamalas" x={72} y={62} w={176} h={50} n="Tampa porta-malas" count={vwc("ve_portamalas")} onClick={addVV}/>
<VRg id="ve_lanterna_e" x={58} y={114} w={46} h={30} n="Lanterna E" count={vwc("ve_lanterna_e")} onClick={addVV}/>
<VRg id="ve_lanterna_d" x={216} y={114} w={46} h={30} n="Lanterna D" count={vwc("ve_lanterna_d")} onClick={addVV}/>
<VRg id="ve_parachoque_t_e" x={54} y={172} w={70} h={22} n="P-chq tras. E" count={vwc("ve_parachoque_t_e")} onClick={addVV}/>
<VRg id="ve_parachoque_t_c" x={126} y={172} w={68} h={22} n="P-chq tras. C" count={vwc("ve_parachoque_t_c")} onClick={addVV}/>
<VRg id="ve_parachoque_t_d" x={196} y={172} w={70} h={22} n="P-chq tras. D" count={vwc("ve_parachoque_t_d")} onClick={addVV}/>
<VRg id="ve_placa_t" x={112} y={196} w={96} h={14} n="Placa traseira" count={vwc("ve_placa_t")} onClick={addVV}/>
</svg>);

const VTetoSvg=()=>(<svg viewBox="0 0 260 360" style={{width:"100%"}}>
<path d="M52 26 Q130 6 208 26 L220 102 Q226 180 220 258 L208 334 Q130 354 52 334 L40 258 Q34 180 40 102Z" fill="none" stroke="#555" strokeWidth="1"/>
<line x1="130" y1="10" x2="130" y2="350" stroke="#555" strokeWidth="0.4" strokeDasharray="4,3"/>
<line x1="36" y1="180" x2="224" y2="180" stroke="#555" strokeWidth="0.4" strokeDasharray="4,3"/>
<text x="130" y="355" textAnchor="middle" fontSize="9" fontWeight="600" fill="#888">TETO (vista superior)</text>
<text x="66" y="20" fontSize="7" fill="#aaa">ANT</text><text x="190" y="20" fontSize="7" fill="#aaa">ANT</text>
<text x="66" y="348" fontSize="7" fill="#aaa">POS</text><text x="190" y="348" fontSize="7" fill="#aaa">POS</text>
<VRg id="ve_teto_ant_e" x={42} y={30} w={86} h={148} n="Teto ant. E" count={vwc("ve_teto_ant_e")} onClick={addVV}/>
<VRg id="ve_teto_ant_d" x={132} y={30} w={86} h={148} n="Teto ant. D" count={vwc("ve_teto_ant_d")} onClick={addVV}/>
<VRg id="ve_teto_pos_e" x={42} y={182} w={86} h={148} n="Teto pos. E" count={vwc("ve_teto_pos_e")} onClick={addVV}/>
<VRg id="ve_teto_pos_d" x={132} y={182} w={86} h={148} n="Teto pos. D" count={vwc("ve_teto_pos_d")} onClick={addVV}/>
</svg>);

const VIntSvg=()=>(<svg viewBox="0 0 280 440" style={{width:"100%"}}>
<path d="M60 24 Q140 6 220 24 L232 72 Q238 120 238 220 Q238 320 232 368 L220 416 Q140 434 60 416 L48 368 Q42 320 42 220 Q42 120 48 72Z" fill="none" stroke="#555" strokeWidth="1"/>
<path d="M75 66 Q140 48 205 66 L200 96 Q140 86 80 96Z" fill="none" stroke="#555" strokeWidth="0.6"/>
<rect x="125" y="96" width="28" height="248" rx="5" fill="none" stroke="#555" strokeWidth="0.4"/>
<circle cx="100" cy="115" r="20" fill="none" stroke="#555" strokeWidth="0.6"/>
<rect x="65" y="138" width="52" height="60" rx="7" fill="none" stroke="#555" strokeWidth="0.5"/>
<rect x="160" y="138" width="52" height="60" rx="7" fill="none" stroke="#555" strokeWidth="0.5"/>
<rect x="58" y="242" width="52" height="54" rx="7" fill="none" stroke="#555" strokeWidth="0.5"/>
<rect x="114" y="242" width="52" height="54" rx="7" fill="none" stroke="#555" strokeWidth="0.5"/>
<rect x="168" y="242" width="52" height="54" rx="7" fill="none" stroke="#555" strokeWidth="0.5"/>
<rect x="65" y="338" width="148" height="56" rx="7" fill="none" stroke="#555" strokeWidth="0.4"/>
<text x="140" y="432" textAnchor="middle" fontSize="9" fontWeight="600" fill="#888">INTERIOR (vista superior)</text>
<VRg id="vi_volante" x={80} y={96} w={40} h={34} n="Volante" count={vwc("vi_volante")} onClick={addVV}/>
<VRg id="vi_painel" x={58} y={72} w={162} h={22} n="Painel de instrum." count={vwc("vi_painel")} onClick={addVV}/>
<VRg id="vi_cambio" x={127} y={120} w={24} h={24} n="Câmbio" count={vwc("vi_cambio")} onClick={addVV}/>
<VRg id="vi_freio_estac" x={127} y={148} w={24} h={22} n="Fr.estac." count={vwc("vi_freio_estac")} onClick={addVV}/>
<VRg id="vi_banco_mot" x={62} y={136} w={56} h={64} n="Bc.Motorista" count={vwc("vi_banco_mot")} onClick={addVV}/>
<VRg id="vi_banco_pass" x={158} y={136} w={56} h={64} n="Bc.Passag." count={vwc("vi_banco_pass")} onClick={addVV}/>
<VRg id="vi_banco_tras_e" x={55} y={240} w={56} h={58} n="Bc.Tras.E" count={vwc("vi_banco_tras_e")} onClick={addVV}/>
<VRg id="vi_banco_tras_c" x={112} y={240} w={56} h={58} n="Bc.Tras.C" count={vwc("vi_banco_tras_c")} onClick={addVV}/>
<VRg id="vi_banco_tras_d" x={168} y={240} w={56} h={58} n="Bc.Tras.D" count={vwc("vi_banco_tras_d")} onClick={addVV}/>
<VRg id="vi_assoalho_ant" x={58} y={202} w={162} h={30} n="Assoalho ant." count={vwc("vi_assoalho_ant")} onClick={addVV}/>
<VRg id="vi_assoalho_pos" x={58} y={300} w={162} h={30} n="Assoalho pos." count={vwc("vi_assoalho_pos")} onClick={addVV}/>
<VRg id="vi_forro_teto" x={65} y={48} w={148} h={22} n="Forro do teto" count={vwc("vi_forro_teto")} onClick={addVV}/>
<VRg id="vi_porta_int_ant_e" x={42} y={104} w={18} h={100} n="Pt.int.AE" count={vwc("vi_porta_int_ant_e")} onClick={addVV}/>
<VRg id="vi_porta_int_ant_d" x={220} y={104} w={18} h={100} n="Pt.int.AD" count={vwc("vi_porta_int_ant_d")} onClick={addVV}/>
<VRg id="vi_porta_int_pos_e" x={42} y={232} w={18} h={96} n="Pt.int.PE" count={vwc("vi_porta_int_pos_e")} onClick={addVV}/>
<VRg id="vi_porta_int_pos_d" x={220} y={232} w={18} h={96} n="Pt.int.PD" count={vwc("vi_porta_int_pos_d")} onClick={addVV}/>
<VRg id="vi_portamalas_int" x={62} y={336} w={154} h={60} n="Int. porta-malas" count={vwc("vi_portamalas_int")} onClick={addVV}/>
<VRg id="vi_console" x={127} y={172} w={24} h={28} n="Console" count={vwc("vi_console")} onClick={addVV}/>
<VRg id="vi_porta_luvas" x={160} y={86} w={56} h={18} n="Porta-luvas" count={vwc("vi_porta_luvas")} onClick={addVV}/>
<VRg id="vi_retrovisor_int" x={125} y={96} w={28} h={18} n="Retrov.int" count={vwc("vi_retrovisor_int")} onClick={addVV}/>
</svg>);

// ════════════════════════════════════════════════════════════════
// VEÍCULOS — Moto, Bicicleta, Caminhão, Ônibus (SVGs interativos)
// ════════════════════════════════════════════════════════════════
const MotoLatSvg=({side})=>{const pfx=side==="E"?"mle_":"mld_";const label=side==="E"?"LATERAL ESQUERDA":"LATERAL DIREITA";return(<svg viewBox="0 0 400 200" style={{width:"100%"}}><circle cx={100} cy={150} r={35} fill="none" stroke="#555" strokeWidth="1"/><circle cx={100} cy={150} r={20} fill="none" stroke="#555" strokeWidth="0.5"/><circle cx={300} cy={150} r={35} fill="none" stroke="#555" strokeWidth="1"/><circle cx={300} cy={150} r={20} fill="none" stroke="#555" strokeWidth="0.5"/><path d="M100 150 L130 80 L170 60 L200 55 L230 60 L260 70 L300 150" fill="none" stroke="#555" strokeWidth="1"/><path d="M130 80 L160 75 L180 80 L170 110 L140 110Z" fill="none" stroke="#555" strokeWidth="0.8"/><path d="M180 55 L175 35 L195 30 L200 55" fill="none" stroke="#555" strokeWidth="0.6"/><path d="M200 60 L230 55 L240 65 L220 75" fill="none" stroke="#555" strokeWidth="0.5"/><path d="M260 100 L280 120 L290 140" fill="none" stroke="#555" strokeWidth="0.6"/><text x="200" y="195" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">{label}</text><VRg id={pfx+"guidao"} x={170} y={28} w={35} h={30} n="Guidão" count={vwc(pfx+"guidao")} onClick={addVV}/><VRg id={pfx+"tanque"} x={185} y={50} w={50} h={25} n="Tanque" count={vwc(pfx+"tanque")} onClick={addVV}/><VRg id={pfx+"motor"} x={128} y={75} w={55} h={40} n="Motor" count={vwc(pfx+"motor")} onClick={addVV}/><VRg id={pfx+"assento"} x={195} y={52} w={50} h={18} n="Assento" count={vwc(pfx+"assento")} onClick={addVV}/><VRg id={pfx+"escape"} x={255} y={95} w={40} h={30} n="Escapamento" count={vwc(pfx+"escape")} onClick={addVV}/><VRg id={pfx+"roda_d"} x={65} y={115} w={70} h={50} n="Roda D" count={vwc(pfx+"roda_d")} onClick={addVV}/><VRg id={pfx+"roda_t"} x={265} y={115} w={70} h={50} n="Roda T" count={vwc(pfx+"roda_t")} onClick={addVV}/><VRg id={pfx+"carena"} x={115} y={60} w={20} h={50} n="Carenagem" count={vwc(pfx+"carena")} onClick={addVV}/></svg>);};
const MotoFrenteSvg=()=>(<svg viewBox="0 0 200 200" style={{width:"100%"}}><circle cx={100} cy={140} r={35} fill="none" stroke="#555" strokeWidth="1"/><path d="M80 105 L85 50 Q100 30 115 50 L120 105" fill="none" stroke="#555" strokeWidth="0.8"/><path d="M75 60 L90 55 L90 70 L75 70Z" fill="none" stroke="#555" strokeWidth="0.5"/><path d="M125 60 L110 55 L110 70 L125 70Z" fill="none" stroke="#555" strokeWidth="0.5"/><text x="100" y="190" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">FRENTE</text><VRg id="mf_farol" x={85} y={42} w={30} h={20} n="Farol" count={vwc("mf_farol")} onClick={addVV}/><VRg id="mf_retrov_e" x={68} y={55} w={18} h={18} n="Retrovisor E" count={vwc("mf_retrov_e")} onClick={addVV}/><VRg id="mf_retrov_d" x={114} y={55} w={18} h={18} n="Retrovisor D" count={vwc("mf_retrov_d")} onClick={addVV}/><VRg id="mf_roda" x={65} y={108} w={70} h={50} n="Roda" count={vwc("mf_roda")} onClick={addVV}/></svg>);
const MotoTrasSvg=()=>(<svg viewBox="0 0 200 200" style={{width:"100%"}}><circle cx={100} cy={140} r={35} fill="none" stroke="#555" strokeWidth="1"/><path d="M80 105 L85 65 Q100 50 115 65 L120 105" fill="none" stroke="#555" strokeWidth="0.8"/><rect x={85} y={55} width={30} height={12} rx={2} fill="none" stroke="#555" strokeWidth="0.5"/><text x="100" y="190" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">TRASEIRA</text><VRg id="mt_lanterna" x={83} y={52} w={34} h={16} n="Lanterna" count={vwc("mt_lanterna")} onClick={addVV}/><VRg id="mt_placa" x={83} y={70} w={34} h={14} n="Placa" count={vwc("mt_placa")} onClick={addVV}/><VRg id="mt_roda" x={65} y={108} w={70} h={50} n="Roda" count={vwc("mt_roda")} onClick={addVV}/></svg>);
const BiciLatSvg=({side})=>{const pfx=side==="E"?"ble_":"bld_";const label=side==="E"?"LATERAL ESQUERDA":"LATERAL DIREITA";return(<svg viewBox="0 0 400 200" style={{width:"100%"}}><circle cx={100} cy={140} r={40} fill="none" stroke="#555" strokeWidth="1"/><circle cx={300} cy={140} r={40} fill="none" stroke="#555" strokeWidth="1"/><path d="M100 140 L160 80 L200 75 L300 140" fill="none" stroke="#555" strokeWidth="1"/><path d="M200 75 L160 80" fill="none" stroke="#555" strokeWidth="0.8"/><path d="M160 80 L200 140 L300 140" fill="none" stroke="#555" strokeWidth="0.8"/><path d="M200 75 L195 55 L205 55 L200 75" fill="none" stroke="#555" strokeWidth="0.6"/><path d="M160 80 L145 50 L175 50" fill="none" stroke="#555" strokeWidth="0.6"/><text x="200" y="195" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">{label}</text><VRg id={pfx+"guidao"} x={140} y={42} w={40} h={25} n="Guidão" count={vwc(pfx+"guidao")} onClick={addVV}/><VRg id={pfx+"quadro"} x={150} y={72} w={60} h={35} n="Quadro" count={vwc(pfx+"quadro")} onClick={addVV}/><VRg id={pfx+"assento"} x={188} y={55} w={25} h={22} n="Assento" count={vwc(pfx+"assento")} onClick={addVV}/><VRg id={pfx+"roda_d"} x={60} y={100} w={80} h={60} n="Roda D" count={vwc(pfx+"roda_d")} onClick={addVV}/><VRg id={pfx+"roda_t"} x={260} y={100} w={80} h={60} n="Roda T" count={vwc(pfx+"roda_t")} onClick={addVV}/><VRg id={pfx+"corrente"} x={180} y={110} w={60} h={30} n="Corrente" count={vwc(pfx+"corrente")} onClick={addVV}/></svg>);};
const CamLatSvg=({side})=>{const pfx=side==="E"?"cle_":"cld_";const label=side==="E"?"LATERAL ESQUERDA":"LATERAL DIREITA";return(<svg viewBox="0 0 450 180" style={{width:"100%"}}><rect x={30} y={40} width={120} height={90} rx={5} fill="none" stroke="#555" strokeWidth="1"/><path d="M40 40 L50 20 Q60 10 100 10 L140 10 Q145 10 148 20 L150 40" fill="none" stroke="#555" strokeWidth="0.7"/><rect x={150} y={20} width={270} height={110} rx={3} fill="none" stroke="#555" strokeWidth="1"/><circle cx={80} cy={140} r={20} fill="none" stroke="#555" strokeWidth="1"/><circle cx={340} cy={140} r={20} fill="none" stroke="#555" strokeWidth="1"/><circle cx={380} cy={140} r={20} fill="none" stroke="#555" strokeWidth="1"/><text x="225" y="175" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">{label}</text><VRg id={pfx+"cabine"} x={28} y={38} w={124} h={94} n="Cabine" count={vwc(pfx+"cabine")} onClick={addVV}/><VRg id={pfx+"vidro"} x={40} y={10} w={110} h={30} n="Vidro" count={vwc(pfx+"vidro")} onClick={addVV}/><VRg id={pfx+"carroceria"} x={148} y={18} w={275} h={115} n="Carroceria" count={vwc(pfx+"carroceria")} onClick={addVV}/><VRg id={pfx+"roda_d"} x={60} y={120} w={40} h={30} n="Roda D" count={vwc(pfx+"roda_d")} onClick={addVV}/><VRg id={pfx+"roda_t1"} x={320} y={120} w={40} h={30} n="Roda T1" count={vwc(pfx+"roda_t1")} onClick={addVV}/><VRg id={pfx+"roda_t2"} x={360} y={120} w={40} h={30} n="Roda T2" count={vwc(pfx+"roda_t2")} onClick={addVV}/></svg>);};
const CamFrenteSvg=()=>(<svg viewBox="0 0 240 200" style={{width:"100%"}}><rect x={40} y={30} width={160} height={120} rx={8} fill="none" stroke="#555" strokeWidth="1"/><path d="M55 30 Q120 15 185 30 L180 60 Q120 50 60 60Z" fill="none" stroke="#555" strokeWidth="0.6"/><rect x={50} y={80} width={30} height={25} rx={4} fill="none" stroke="#555" strokeWidth="0.5"/><rect x={160} y={80} width={30} height={25} rx={4} fill="none" stroke="#555" strokeWidth="0.5"/><text x="120" y="185" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">FRENTE</text><VRg id="cf_parabrisa" x={50} y={18} w={140} h={44} n="Para-brisa" count={vwc("cf_parabrisa")} onClick={addVV}/><VRg id="cf_farol_e" x={42} y={76} w={40} h={30} n="Farol E" count={vwc("cf_farol_e")} onClick={addVV}/><VRg id="cf_farol_d" x={158} y={76} w={40} h={30} n="Farol D" count={vwc("cf_farol_d")} onClick={addVV}/><VRg id="cf_grade" x={85} y={76} w={70} h={30} n="Grade" count={vwc("cf_grade")} onClick={addVV}/><VRg id="cf_parachoque" x={42} y={130} w={156} h={16} n="Para-choque" count={vwc("cf_parachoque")} onClick={addVV}/></svg>);
const CamTrasSvg=()=>(<svg viewBox="0 0 260 200" style={{width:"100%"}}><rect x={30} y={20} width={200} height={130} rx={3} fill="none" stroke="#555" strokeWidth="1"/><rect x={60} y={50} width={140} height={80} rx={2} fill="none" stroke="#555" strokeWidth="0.5"/><text x="130" y="185" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">TRASEIRA</text><VRg id="ct_porta_t" x={55} y={45} w={150} h={90} n="Porta traseira" count={vwc("ct_porta_t")} onClick={addVV}/><VRg id="ct_lanterna_e" x={32} y={30} w={25} h={20} n="Lanterna E" count={vwc("ct_lanterna_e")} onClick={addVV}/><VRg id="ct_lanterna_d" x={203} y={30} w={25} h={20} n="Lanterna D" count={vwc("ct_lanterna_d")} onClick={addVV}/><VRg id="ct_parachoque" x={32} y={138} w={196} h={14} n="Para-choque" count={vwc("ct_parachoque")} onClick={addVV}/><VRg id="ct_placa" x={85} y={135} w={90} h={12} n="Placa" count={vwc("ct_placa")} onClick={addVV}/></svg>);
const CamIntSvg=()=>(<svg viewBox="0 0 220 240" style={{width:"100%"}}><rect x={40} y={20} width={140} height={180} rx={8} fill="none" stroke="#555" strokeWidth="1"/><path d="M55 20 Q110 8 165 20 L160 50 Q110 42 60 50Z" fill="none" stroke="#555" strokeWidth="0.6"/><circle cx={80} cy={80} r={16} fill="none" stroke="#555" strokeWidth="0.6"/><rect x={55} y={100} width={45} height={40} rx={5} fill="none" stroke="#555" strokeWidth="0.5"/><rect x={120} y={100} width={45} height={40} rx={5} fill="none" stroke="#555" strokeWidth="0.5"/><text x="110" y="225" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">CABINE</text><VRg id="ci_volante" x={64} y={64} w={32} h={28} n="Volante" count={vwc("ci_volante")} onClick={addVV}/><VRg id="ci_painel" x={48} y={40} w={124} h={18} n="Painel" count={vwc("ci_painel")} onClick={addVV}/><VRg id="ci_banco_mot" x={52} y={98} w={50} h={44} n="Banco motorista" count={vwc("ci_banco_mot")} onClick={addVV}/><VRg id="ci_banco_pass" x={118} y={98} w={50} h={44} n="Banco passageiro" count={vwc("ci_banco_pass")} onClick={addVV}/><VRg id="ci_piso" x={52} y={148} w={116} h={30} n="Piso" count={vwc("ci_piso")} onClick={addVV}/></svg>);
const BusLatSvg=({side})=>{const pfx=side==="E"?"bse_":"bsd_";const label=side==="E"?"LATERAL ESQUERDA":"LATERAL DIREITA";return(<svg viewBox="0 0 460 180" style={{width:"100%"}}><rect x={20} y={20} width={420} height={110} rx={10} fill="none" stroke="#555" strokeWidth="1"/><path d="M30 20 Q50 10 100 10 L120 20" fill="none" stroke="#555" strokeWidth="0.6"/>{[0,1,2,3,4,5].map(wi=><rect key={wi} x={60+wi*60} y={30} width={40} height={35} rx={3} fill="none" stroke="#555" strokeWidth="0.4"/>)}<circle cx={80} cy={140} r={18} fill="none" stroke="#555" strokeWidth="1"/><circle cx={380} cy={140} r={18} fill="none" stroke="#555" strokeWidth="1"/><text x="230" y="175" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">{label}</text><VRg id={pfx+"frente"} x={18} y={18} w={80} h={115} n="Frente" count={vwc(pfx+"frente")} onClick={addVV}/><VRg id={pfx+"meio"} x={100} y={18} w={200} h={115} n="Meio" count={vwc(pfx+"meio")} onClick={addVV}/><VRg id={pfx+"tras"} x={302} y={18} w={140} h={115} n="Traseira" count={vwc(pfx+"tras")} onClick={addVV}/><VRg id={pfx+"roda_d"} x={62} y={122} w={36} h={26} n="Roda D" count={vwc(pfx+"roda_d")} onClick={addVV}/><VRg id={pfx+"roda_t"} x={362} y={122} w={36} h={26} n="Roda T" count={vwc(pfx+"roda_t")} onClick={addVV}/></svg>);};
const BusFrenteSvg=()=>(<svg viewBox="0 0 200 200" style={{width:"100%"}}><rect x={30} y={20} width={140} height={130} rx={10} fill="none" stroke="#555" strokeWidth="1"/><path d="M45 20 Q100 8 155 20 L150 55 Q100 45 50 55Z" fill="none" stroke="#555" strokeWidth="0.6"/><rect x={40} y={70} width={30} height={20} rx={4} fill="none" stroke="#555" strokeWidth="0.5"/><rect x={130} y={70} width={30} height={20} rx={4} fill="none" stroke="#555" strokeWidth="0.5"/><text x="100" y="185" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">FRENTE</text><VRg id="bf_parabrisa" x={40} y={16} w={120} h={42} n="Para-brisa" count={vwc("bf_parabrisa")} onClick={addVV}/><VRg id="bf_farol_e" x={32} y={66} w={40} h={28} n="Farol E" count={vwc("bf_farol_e")} onClick={addVV}/><VRg id="bf_farol_d" x={128} y={66} w={40} h={28} n="Farol D" count={vwc("bf_farol_d")} onClick={addVV}/><VRg id="bf_letreiro" x={55} y={100} w={90} h={16} n="Letreiro" count={vwc("bf_letreiro")} onClick={addVV}/><VRg id="bf_parachoque" x={32} y={132} w={136} h={16} n="Para-choque" count={vwc("bf_parachoque")} onClick={addVV}/></svg>);
const BusTrasSvg=()=>(<svg viewBox="0 0 200 200" style={{width:"100%"}}><rect x={30} y={20} width={140} height={130} rx={10} fill="none" stroke="#555" strokeWidth="1"/><rect x={40} y={30} width={40} height={20} rx={3} fill="none" stroke="#555" strokeWidth="0.5"/><rect x={120} y={30} width={40} height={20} rx={3} fill="none" stroke="#555" strokeWidth="0.5"/><text x="100" y="185" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">TRASEIRA</text><VRg id="bt_visor" x={50} y={55} w={100} h={30} n="Visor" count={vwc("bt_visor")} onClick={addVV}/><VRg id="bt_lanterna_e" x={35} y={26} w={48} h={26} n="Lanterna E" count={vwc("bt_lanterna_e")} onClick={addVV}/><VRg id="bt_lanterna_d" x={117} y={26} w={48} h={26} n="Lanterna D" count={vwc("bt_lanterna_d")} onClick={addVV}/><VRg id="bt_motor" x={50} y={90} w={100} h={40} n="Motor" count={vwc("bt_motor")} onClick={addVV}/><VRg id="bt_parachoque" x={32} y={132} w={136} h={16} n="Para-choque" count={vwc("bt_parachoque")} onClick={addVV}/></svg>);
const BusIntSvg=()=>(<svg viewBox="0 0 220 360" style={{width:"100%"}}>
<rect x={35} y={20} width={150} height={310} rx={10} fill="none" stroke="#555" strokeWidth="1"/>
<path d="M50 20 Q110 8 170 20 L165 50 Q110 42 55 50Z" fill="none" stroke="#555" strokeWidth="0.6"/>
<circle cx={75} cy={75} r={14} fill="none" stroke="#555" strokeWidth="0.5"/>
{[0,1,2,3,4,5].map(ri=><g key={ri}><rect x={42} y={95+ri*35} width={30} height={25} rx={3} fill="none" stroke="#555" strokeWidth="0.3"/><rect x={148} y={95+ri*35} width={30} height={25} rx={3} fill="none" stroke="#555" strokeWidth="0.3"/></g>)}
<line x1="110" y1="90" x2="110" y2="310" stroke="#ddd" strokeWidth="0.3"/>
<line x1="38" y1="162" x2="182" y2="162" stroke="#ddd" strokeWidth="0.3"/>
<line x1="38" y1="232" x2="182" y2="232" stroke="#ddd" strokeWidth="0.3"/>
<rect x={160} y={145} width={18} height={35} rx={2} fill="none" stroke="#777" strokeWidth="0.4"/>
<rect x={160} y={260} width={18} height={35} rx={2} fill="none" stroke="#777" strokeWidth="0.4"/>
<text x="110" y="345" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">INTERIOR</text>
<VRg id="bi_parabrisa" x={45} y={20} w={130} h={20} n="Parabrisa" count={vwc("bi_parabrisa")} onClick={addVV}/>
<VRg id="bi_painel" x={45} y={38} w={130} h={16} n="Painel" count={vwc("bi_painel")} onClick={addVV}/>
<VRg id="bi_motorista" x={50} y={55} w={50} h={35} n="Motorista" count={vwc("bi_motorista")} onClick={addVV}/>
<VRg id="bi_cobrador" x={110} y={55} w={50} h={35} n="Cobrador" count={vwc("bi_cobrador")} onClick={addVV}/>
<VRg id="bi_porta_frente" x={160} y={55} w={24} h={35} n="Porta frente" count={vwc("bi_porta_frente")} onClick={addVV}/>
<VRg id="bi_ass_e_frente" x={38} y={90} w={40} h={72} n="Assento E frente" count={vwc("bi_ass_e_frente")} onClick={addVV}/>
<VRg id="bi_ass_d_frente" x={142} y={90} w={40} h={72} n="Assento D frente" count={vwc("bi_ass_d_frente")} onClick={addVV}/>
<VRg id="bi_corr_frente" x={80} y={90} w={60} h={72} n="Corredor frente" count={vwc("bi_corr_frente")} onClick={addVV}/>
<VRg id="bi_porta_meio" x={160} y={145} w={24} h={35} n="Porta meio" count={vwc("bi_porta_meio")} onClick={addVV}/>
<VRg id="bi_ass_e_meio" x={38} y={162} w={40} h={70} n="Assento E meio" count={vwc("bi_ass_e_meio")} onClick={addVV}/>
<VRg id="bi_ass_d_meio" x={142} y={162} w={40} h={70} n="Assento D meio" count={vwc("bi_ass_d_meio")} onClick={addVV}/>
<VRg id="bi_corr_meio" x={80} y={162} w={60} h={70} n="Corredor meio" count={vwc("bi_corr_meio")} onClick={addVV}/>
<VRg id="bi_ass_e_tras" x={38} y={232} w={40} h={78} n="Assento E traseira" count={vwc("bi_ass_e_tras")} onClick={addVV}/>
<VRg id="bi_ass_d_tras" x={142} y={232} w={40} h={78} n="Assento D traseira" count={vwc("bi_ass_d_tras")} onClick={addVV}/>
<VRg id="bi_corr_tras" x={80} y={232} w={60} h={78} n="Corredor traseira" count={vwc("bi_corr_tras")} onClick={addVV}/>
<VRg id="bi_porta_tras" x={160} y={260} w={24} h={35} n="Porta traseira" count={vwc("bi_porta_tras")} onClick={addVV}/>
<VRg id="bi_banco_tras" x={40} y={310} w={140} h={18} n="Banco traseiro" count={vwc("bi_banco_tras")} onClick={addVV}/>
</svg>);


// TAB RENDER
const cx=`c${cadaverIdx}_`;
const tabHasData=(i)=>{const d=data;if(i===TAB_SOLICITACAO)return !!(d.oc||d.nat||d.dt_sol);if(i===TAB_LOCAL)return !!(d.end||d.iso||d.tp||d.av_veg||d.av_obs||trilhas.length||edificacoes.some(e=>e.tipo));if(i===TAB_VESTIGIOS)return vestigios.some(v=>v.desc)||papilos.some(p=>p.desc);if(i===TAB_CADAVER)return cadaveres.some((_,ci)=>d[`c${ci}_fx`]||d[`c${ci}_dg`]||d[`c${ci}_sx`])||wounds.length>0;if(i===TAB_VEICULO)return veiculos.some((_,vi)=>d[`v${vi}_tipo`]||d[`v${vi}_placa`]||d[`v${vi}_cat`])||veiVest.length>0;if(i===TAB_DESENHO)return !!(stampObjs.length||Object.values(imgRef.current||{}).some(v=>v));return false;};
// ── fotoTab: mapeia ref da foto → índice da aba correspondente ──
// Corrige bug em que startsWith("local") perdia refs como "endereco", "edif_1", etc.
const fotoTab=(ref)=>{if(!ref)return -1;if(ref==="solicitacao")return TAB_SOLICITACAO;if(ref==="local"||ref==="endereco"||ref==="isolamento"||ref==="via")return TAB_LOCAL;if(ref.startsWith("edif_")||ref.startsWith("comodo_")||ref.startsWith("trilha_")||ref.startsWith("vp_")||ref.startsWith("av_"))return TAB_LOCAL;if(ref==="vestigios")return TAB_VESTIGIOS;if(ref.startsWith("vest_")||ref.startsWith("papilo_")||ref.startsWith("placa_"))return TAB_VESTIGIOS;if(ref==="cadaver")return TAB_CADAVER;if(ref.startsWith("cad_")||ref.startsWith("veste_")||ref.startsWith("wound_"))return TAB_CADAVER;if(ref==="veiculo")return TAB_VEICULO;if(ref.startsWith("vei_")||ref.startsWith("veivest_"))return TAB_VEICULO;return -1;};
// B6: pré-calcula contagem por aba uma vez (evita filter N×7 a cada render)
const fotoCountByTab=useMemo(()=>{const counts={};(fotos||[]).forEach(f=>{const ti=fotoTab(f.ref);if(ti>=0)counts[ti]=(counts[ti]||0)+1;});return counts;},[fotos]);
const tabFotoCount=(i)=>fotoCountByTab[i]||0;
const tabBadge=(i)=>{if(i===TAB_VESTIGIOS){const n=vestigios.filter(v=>v.desc).length;return n||"";}if(i===TAB_CADAVER)return wounds.length||"";if(i===TAB_VEICULO){const n=veiVest.length;return n||"";}if(i===TAB_EXPORTAR)return fotos.length||"";return"";};
const checkCampos=()=>{const d=data;const w=[];const ck=(val,label,aba)=>{if(!val||!val.trim())w.push({campo:label,aba});};
ck(d.oc,"Ocorrência","Solicitação");ck(d.oc_ano,"Ano","Solicitação");ck(d.dp,"DP","Solicitação");ck(d.nat,"Natureza","Solicitação");ck(d.dt_sol,"Data/Hora Solicitação","Solicitação");
ck(d.dt_des,"Deslocamento","Atendimento");ck(d.dt_che,"Chegada","Atendimento");ck(d.dt_ter,"Término","Atendimento");
ck(d.p2,"2º Perito","Equipe");ck(d.ag==="Outro"?d.ag_outro:d.ag,"Agente","Equipe");ck(d.pp==="Outro"?d.pp_outro:d.pp,"Papiloscopista","Equipe");ck(d.mat_pp,"Matrícula Papilo.","Equipe");ck(d.vt==="Outra"?d.vt_outro:d.vt,"Viatura","Equipe");
ck(d.end,"Endereço","Endereço");ck(d.gps,"GPS","Endereço");
ck(d.iso,"Status do isolamento","Isolamento");ck(d.pres,"Preservação","Isolamento");ck(d.rp,"Responsável","Isolamento");ck(d.mt,"Matrícula","Isolamento");ck(d.org,"Instituição","Isolamento");
return w;};
const renderTab=()=>{
  // ╔════════════════════════════════════════╗
  // ║  ABA 0 — SOLICITAÇÃO                   ║
  // ╚════════════════════════════════════════╝
if(tab===TAB_SOLICITACAO)return(<><Cd_ styles={ST} title="Solicitação" aria-label="Solicitação" icon="📄" variant="primary"><div style={{display:"flex",flexDirection:"column",gap:12}}><F_ k="oc" label="Nº Ocorrência" val={g("oc")} onChange={s} styles={ST}/><div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:12}}><div><label style={lb}>DP</label><select style={sel} value={g("dp")} onChange={e=>s("dp",e.target.value)}><option value=""></option><option>1ª DP</option><option>2ª DP</option><option>3ª DP</option><option>4ª DP</option><option>5ª DP</option><option>6ª DP</option><option>7ª DP</option><option>8ª DP</option><option>9ª DP</option><option>10ª DP</option><option>11ª DP</option><option>12ª DP</option><option>13ª DP</option><option>14ª DP</option><option>15ª DP</option><option>16ª DP</option><option>17ª DP</option><option>18ª DP</option><option>19ª DP</option><option>20ª DP</option><option>21ª DP</option><option>22ª DP</option><option>23ª DP</option><option>24ª DP</option><option>25ª DP</option><option>26ª DP</option><option>27ª DP</option><option>28ª DP</option><option>29ª DP</option><option>30ª DP</option><option>31ª DP</option><option>32ª DP</option><option>33ª DP</option><option>34ª DP</option><option>35ª DP</option><option>36ª DP</option><option>37ª DP</option><option>38ª DP</option><option>DEAM</option><option>DEAM II</option><option>DCA</option><option>DCA II</option><option>Outro</option></select>{g("dp")==="Outro"&&<TX_ value={g("dp_outro")} placeholder="Digite a DP" inputStyle={{...inp,marginTop:6}} onCommit={(val)=>s("dp_outro",val)}/>}</div><div><label style={lb}>Ano</label>{(()=>{const yNow=new Date().getFullYear();const yCur=parseInt(g("oc_ano")||""+yNow,10)||yNow;const opts=[];for(let yy=yNow-3;yy<=yNow+1;yy++)opts.push(yy);return(<select style={sel} value={String(yCur)} onChange={e=>s("oc_ano",e.target.value)}>{opts.map(yy=><option key={yy} value={String(yy)}>{String(yy).slice(-2)}</option>)}</select>);})()}</div></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}><div><label style={lb}>Natureza</label><select style={sel} value={g("nat")} onChange={e=>s("nat",e.target.value)}><option value=""></option><option>Homicídio</option><option>Feminicídio</option><option>Tentativa de feminicídio</option><option>Tentativa de homicídio</option><option>Lesão corporal</option><option>Suicídio</option><option>Cadáver encontrado</option><option>Afogado</option><option>Estupro</option><option>Complementar</option><option>Pátio</option><option>Outros</option></select>{g("nat")==="Outros"&&<TX_ value={g("nat_outro")} inputStyle={{...inp,marginTop:6}} onCommit={(val)=>s("nat_outro",val)}/>}</div><F_ k="oic" label="Exame Externo" val={g("oic")} onChange={s} styles={ST}/></div><div style={{marginTop:12}}><Nw_ k="dt_sol" label="Data/Hora Solicitação" val={g("dt_sol")} onChange={s} styles={ST}/></div></Cd_>
<Cd_ styles={ST} title="Atendimento" aria-label="Atendimento" icon="🚗" variant="teal"><div style={{display:"flex",flexDirection:"column",gap:12}}><Nw_ k="dt_des" label="Deslocamento" val={g("dt_des")} onChange={s} styles={ST}/><Nw_ k="dt_che" label="Chegada" val={g("dt_che")} onChange={s} styles={ST}/><Nw_ k="dt_ter" label="Término" val={g("dt_ter")} onChange={s} styles={ST}/></div></Cd_>
<Cd_ styles={ST} title="Equipe" aria-label="Equipe" icon="👥" variant="info"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lb}>2º Perito</label>{(()=>{const p2=g("p2");const p2InList=p2&&PERITOS_LIST.some(pl=>pl.nome===p2);const showOutro=(p2&&!p2InList)||g("p2_m")==="1";const selectVal=showOutro?"__outro__":(p2InList?p2:"");return(<><select style={sel} value={selectVal} onChange={e=>{const v=e.target.value;if(v==="__outro__"){setData(prev=>({...prev,p2_m:"1"}));}else if(v===""){setData(prev=>({...prev,p2:"",mat_p2:"",p2_m:""}));}else{const found=PERITOS_LIST.find(pl=>pl.nome===v);setData(prev=>({...prev,p2:v,mat_p2:found?found.mat:"",p2_m:""}));}}}><option value=""></option>{PERITOS_LIST.map(pl=><option key={pl.mat} value={pl.nome}>{pl.nome}</option>)}<option value="__outro__">Outro (digitar)</option></select>{p2InList&&!showOutro&&<div style={{marginTop:6,padding:"6px 10px",background:t.successBgS,border:`1px solid ${t.ok}`,borderRadius:6,fontSize:13,color:t.tx}}>👤 <b>{p2}</b> — Mat.: <b>{g("mat_p2")||"—"}</b></div>}{showOutro&&<div style={{marginTop:6,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}><TX_ value={p2} placeholder="Nome" inputStyle={{...inp,fontSize:13}} onCommit={(val)=>s("p2",toTitleCase(val))}/><input autoComplete="off" autoCorrect="off" spellCheck={false} style={{...inp,fontSize:13}} defaultValue={g("mat_p2")} placeholder="Matrícula" onBlur={e=>s("mat_p2",e.target.value)}/></div>}</>);})()}</div><div><label style={lb}>Agente</label><select style={sel} value={g("ag")} onChange={e=>s("ag",e.target.value)}><option value=""></option><option>Ana Paula</option><option>Claudomir</option><option>Fernando</option><option>Hieda</option><option>Manzam</option><option>Roberto Carlos</option><option>Walter</option><option>Outro</option></select>{g("ag")==="Outro"&&<TX_ value={g("ag_outro")} placeholder="Digite o nome" inputStyle={{...inp,marginTop:6}} onCommit={(val)=>s("ag_outro",val)}/>}</div><div><label style={lb}>Papiloscopista</label><select style={sel} value={g("pp")} onChange={e=>s("pp",e.target.value)}><option value=""></option><option>Altair</option><option>Bruna</option><option>Carla</option><option>Edevandro</option><option>Felipe</option><option>Guilherme</option><option>Mariane</option><option>Rafael</option><option>Rafaela</option><option>Outro</option></select>{g("pp")==="Outro"&&<TX_ value={g("pp_outro")} placeholder="Digite o nome" inputStyle={{...inp,marginTop:6}} onCommit={(val)=>s("pp_outro",val)}/>}</div><F_ k="mat_pp" label="Matrícula Papilo." val={g("mat_pp")} onChange={s} styles={ST}/><div><label style={lb}>Viatura</label><select style={sel} value={g("vt")} onChange={e=>s("vt",e.target.value)}><option value=""></option><option>T-118</option><option>T-120</option><option>T-130</option><option>Outra</option></select>{g("vt")==="Outra"&&<TX_ value={g("vt_outro")} placeholder="Digite a viatura" inputStyle={{...inp,marginTop:6}} onCommit={(val)=>s("vt_outro",val)}/>}</div></div></Cd_>
<Cd_ styles={ST} title="Observações" aria-label="Observações" icon="📝"><F_ k="obs_sol" label="Observações — Solicitação / Histórico" type="textarea" val={g("obs_sol")} onChange={s} styles={ST}/></Cd_>
{navBtns()}</>);
  // ╔════════════════════════════════════════╗
  // ║  ABA 1 — LOCAL (Endereço, Edificações) ║
  // ╚════════════════════════════════════════╝
if(tab===TAB_LOCAL)return(<><Cd_ styles={ST} title="Endereço" aria-label="Endereço" icon="📍" variant="primary"><div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}><span style={{fontSize:11,fontWeight:500,color:t.t2,textTransform:"uppercase",letterSpacing:0.5}}>Endereço</span><FotoBtn rk="endereco"/></div><F_ k="end" label="" val={g("end")} onChange={s} styles={ST}/><div style={{marginTop:12}}><label style={lb}>GPS</label><div style={{display:"flex",gap:6}}><input autoComplete="off" autoCorrect="off" spellCheck={false} ref={gpsRef} style={{...inp,flex:1}} defaultValue={g("gps")} onBlur={e=>s("gps",e.target.value)}/><button type="button" style={{...bt,background:gpsLoading?"#888":t.ac,color:"#fff",padding:"9px 12px",display:"flex",alignItems:"center",gap:4}} disabled={gpsLoading} onClick={doGPS}><MapPin size={14}/>{gpsLoading?"…":"GPS"}</button></div>{g("gps_fallback")==="1"&&!g("gps")&&<div style={{marginTop:8,background:t.warningBg,border:`1.5px solid ${t.warningBd}`,borderRadius:10,padding:12}}><p style={{fontSize:12,fontWeight:600,color:t.tx,margin:"0 0 8px",display:"flex",alignItems:"center"}}><AppIcon name="📍" size={14} mr={5}/>GPS bloqueado neste ambiente</p><p style={{fontSize:11,color:t.t2,margin:"0 0 8px",lineHeight:1.5}}>Abra o Google Maps, toque no ponto azul da sua localização, copie as coordenadas e cole acima.</p><a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" style={{display:"block",background:t.ac,color:"#fff",textAlign:"center",padding:"10px 16px",borderRadius:8,fontSize:14,fontWeight:600,textDecoration:"none"}}><AppIcon name="🗺️" size={14} mr={4}/>Abrir Google Maps</a></div>}</div></Cd_>
<Cd_ styles={ST} title="Recursos Empregados" aria-label="Recursos Empregados" icon="🛰️" variant="teal"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><SN_ k="drone" label="Drone?" val={g("drone")} onChange={s} styles={ST}/><SN_ k="scanner" label="Scanner?" val={g("scanner")} onChange={s} styles={ST}/><SN_ k="luminol" label="Luminol?" val={g("luminol")} onChange={s} styles={ST}/><SN_ k="luz_forense" label="Luz forense?" val={g("luz_forense")} onChange={s} styles={ST}/></div></Cd_>
<Cd_ styles={ST} title="Isolamento" aria-label="Isolamento" icon="🔒" variant="warning"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:11,fontWeight:500,color:t.t2}}>Isolamento</span><FotoBtn rk="isolamento"/></div><div><label style={lb}>Status do isolamento</label><select style={sel} value={g("iso")} onChange={e=>s("iso",e.target.value)}><option value=""></option><option>Isolado</option><option>Isolado precariamente</option><option>Isolado precariamente (área insuficiente)</option><option>Isolado precariamente (exiguidade de barreiras físicas)</option><option>Isolado precariamente (inexistência de barreiras físicas)</option><option>Não isolado</option></select></div><SN_ k="pres" label="Preservação?" val={g("pres")} onChange={s} styles={ST}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}><F_ k="rp" label="Responsável" val={g("rp")} onChange={s} styles={ST}/><F_ k="mt" label="Matrícula" val={g("mt")} onChange={s} styles={ST}/><div><label style={lb}>Instituição</label><select style={sel} value={g("org")} onChange={e=>s("org",e.target.value)}><option value=""></option><option>PEL</option><option>1ª DP</option><option>2ª DP</option><option>3ª DP</option><option>4ª DP</option><option>5ª DP</option><option>6ª DP</option><option>7ª DP</option><option>8ª DP</option><option>9ª DP</option><option>10ª DP</option><option>11ª DP</option><option>12ª DP</option><option>13ª DP</option><option>14ª DP</option><option>15ª DP</option><option>16ª DP</option><option>17ª DP</option><option>18ª DP</option><option>19ª DP</option><option>20ª DP</option><option>21ª DP</option><option>22ª DP</option><option>23ª DP</option><option>24ª DP</option><option>25ª DP</option><option>26ª DP</option><option>27ª DP</option><option>28ª DP</option><option>29ª DP</option><option>30ª DP</option><option>31ª DP</option><option>32ª DP</option><option>33ª DP</option><option>34ª DP</option><option>35ª DP</option><option>36ª DP</option><option>37ª DP</option><option>38ª DP</option><option>PMDF</option><option>CBMDF</option><option>DETRAN</option><option>PRF</option><option>Outro</option></select></div><F_ k="vr" label="Viatura" val={g("vr")} onChange={s} styles={ST}/></div><div style={{marginTop:12}}><F_ k="obs_i" label="Observações — Isolamento" type="textarea" val={g("obs_i")} onChange={s} styles={ST}/></div></Cd_>
<Cd_ styles={ST} title="Classificação" aria-label="Classificação" icon="🏘️" variant="info"><div style={{display:"flex",flexDirection:"column",gap:14}}><Rd_ k="area" label="Área" opts={["Urbana","Rural","Outro"]} val={g("area")} onChange={s} styles={ST}/><Rd_ k="dest" label="Destinação" opts={["Residencial","Comercial","Misto","Área verde","Delegacia","Penitenciária","Outro"]} val={g("dest")} onChange={s} styles={ST}/><div><label style={lb}>Tipo (selecione 1 ou mais)</label><div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>{["Edificação","Lote","Área externa","Estabelecimento","Via pública","Cela","Estacionamento","Outro"].map(opt=>{const cur=Array.isArray(g("tp"))?g("tp"):(g("tp")?[g("tp")]:[]);const isOn=cur.includes(opt);return <button type="button" key={opt} style={ch(isOn)} onClick={()=>{const nx=isOn?cur.filter(x=>x!==opt):[...cur,opt];s("tp",nx);}}>{opt}</button>;})}
</div></div></div></Cd_>
<Cd_ styles={ST} title="Via" aria-label="Via" icon="🛤️" variant="primary"><div style={{display:"flex",alignItems:"center",gap:4,marginBottom:8}}><span style={{fontSize:11,fontWeight:500,color:t.t2,textTransform:"uppercase",letterSpacing:0.5}}>Via</span><FotoBtn rk="via"/></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:14,alignItems:"start"}}><Rd_ k="via" label="Tipo" opts={["Pavimentada","Terra"]} val={g("via")} onChange={s} styles={ST}/><SN_ k="ilu" label="Iluminação?" val={g("ilu")} onChange={s} styles={ST}/><SN_ k="ilul" label="Ligada?" val={g("ilul")} onChange={s} styles={ST}/></div></Cd_>
{tpHas(g("tp"),"Via pública")&&<><Cd_ styles={ST} title="Via Pública — Características" aria-label="Via Pública — Características" icon="🛣️" variant="teal"><div style={{display:"flex",alignItems:"center",gap:4,marginBottom:8}}><span style={{fontSize:11,fontWeight:500,color:t.t2}}>Características da via</span><FotoBtn rk="vp_caract"/></div><div style={{display:"flex",flexDirection:"column",gap:12}}><Rd_ k="vp_pav" label="Pavimento" opts={["Asfalto","Paralelepípedo","Terra","Concreto","Outro"]} val={g("vp_pav")} onChange={s} styles={ST}/><F_ k="vp_faixas" label="Nº de faixas / pistas" val={g("vp_faixas")} onChange={s} styles={ST}/><Rd_ k="vp_mao" label="Mão" opts={["Única","Dupla"]} val={g("vp_mao")} onChange={s} styles={ST}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><SN_ k="vp_canteiro" label="Canteiro central?" val={g("vp_canteiro")} onChange={s} styles={ST}/>{g("vp_canteiro")==="Sim"&&<F_ k="vp_canteiro_tipo" label="Tipo canteiro" val={g("vp_canteiro_tipo")} onChange={s} styles={ST}/>}</div><Rd_ k="vp_meiofio" label="Meio-fio" opts={["Existente","Rebaixado","Ausente"]} val={g("vp_meiofio")} onChange={s} styles={ST}/><Rd_ k="vp_calcada" label="Calçada" opts={["Existente","Transitável","Inexistente"]} val={g("vp_calcada")} onChange={s} styles={ST}/><F_ k="vp_obs_caract" label="Obs características" type="textarea" val={g("vp_obs_caract")} onChange={s} styles={ST}/></div></Cd_>
<Cd_ styles={ST} title="Via Pública — Condições" aria-label="Via Pública — Condições" icon="🚦" variant="info"><div style={{display:"flex",alignItems:"center",gap:4,marginBottom:8}}><span style={{fontSize:11,fontWeight:500,color:t.t2}}>Condições no momento</span><FotoBtn rk="vp_cond"/></div><div style={{display:"flex",flexDirection:"column",gap:12}}><Rd_ k="vp_transito" label="Trânsito" opts={["Intenso","Moderado","Livre","Interrompido"]} val={g("vp_transito")} onChange={s} styles={ST}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><SN_ k="vp_frenagem" label="Marcas de frenagem?" val={g("vp_frenagem")} onChange={s} styles={ST}/>{g("vp_frenagem")==="Sim"&&<F_ k="vp_frenagem_comp" label="Comprimento (m)" val={g("vp_frenagem_comp")} onChange={s} styles={ST}/>}</div><SN_ k="vp_derrapagem" label="Marcas de derrapagem?" val={g("vp_derrapagem")} onChange={s} styles={ST}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><SN_ k="vp_debris" label="Debris / fragmentos?" val={g("vp_debris")} onChange={s} styles={ST}/>{g("vp_debris")==="Sim"&&<F_ k="vp_debris_obs" label="Obs debris" val={g("vp_debris_obs")} onChange={s} styles={ST}/>}</div><F_ k="vp_obs_cond" label="Obs condições" type="textarea" val={g("vp_obs_cond")} onChange={s} styles={ST}/></div></Cd_>
<Cd_ styles={ST} title="Via Pública — Manchas de Sangue" aria-label="Via Pública — Manchas de Sangue" icon="🩸" variant="danger"><div style={{display:"flex",alignItems:"center",gap:4,marginBottom:8}}><span style={{fontSize:11,fontWeight:500,color:t.t2}}>Manchas na via</span><FotoBtn rk="vp_manchas"/></div>{[["vp_mr","Regulares",["Gotejadas","Projetadas","Cast-off","Impactadas"]],["vp_mi","Irregulares",["Contato","Transferidas","Alter. contato"]],["vp_ma","Alteradas",["Sombra","Diluição"]],["vp_mac","Acúmulo",["Sangue s. sangue","Poça","Saturação"]],["vp_me","Escorrimento",["Escorrimento"]],["vp_mo","Outras",["Geral","Trilha"]]].map(([mk,ml,mopts])=>{const mv=data[mk]||[];return(<div key={mk} style={{marginBottom:6}}><label style={{...lb,fontSize:12}}>{ml}</label><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{mopts.map(o=>{const s2=mv.includes(o);return <button type="button" key={o} style={{...ch(s2),fontSize:11,padding:"4px 10px"}} onClick={()=>{const a2=[...mv];const ix=a2.indexOf(o);s(mk,ix>-1?a2.filter(x=>x!==o):[...a2,o]);}}>{o}</button>;})}
</div></div>);})}
<F_ k="vp_obs_manchas" label="Obs manchas" type="textarea" val={g("vp_obs_manchas")} onChange={s} styles={ST}/></Cd_>
<Cd_ styles={ST} title="Trilhas de Sangue" aria-label="Trilhas de Sangue" icon="🩸" variant="danger">{trilhas.map((tr,ti)=>{const ut=(k2,v2)=>{setTrilhas(prev=>prev.map((tr2,j)=>j===ti?{...tr2,[k2]:v2}:tr2));};return(<div key={tr.id} style={{background:t.dangerBg,border:`1.5px solid ${t.dangerBd}`,borderRadius:12,padding:20,marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:14,fontWeight:700,color:t.no}}>🩸 Trilha {ti+1}</span><FotoBtn rk={"trilha_"+tr.id}/><button type="button" style={{background:"rgba(255,59,48,0.12)",border:`1.5px solid ${t.no}`,color:t.no,cursor:"pointer",fontSize:20,fontWeight:700,borderRadius:10,padding:"4px 12px",minWidth:40,minHeight:44,lineHeight:1,fontFamily:"inherit"}} title="Remover trilha" aria-label="Remover trilha" onClick={()=>{const hasData=!!(tr.origem||tr.destino||tr.comprimento||tr.padrao||tr.obs);const doDel=()=>setTrilhas(trilhas.filter((_,j)=>j!==ti));if(hasData){reqDel(`Remover Trilha ${ti+1}?`,tr.origem||tr.destino?`${tr.origem||"?"} → ${tr.destino||"?"}`:"(trilha com dados)",doDel);}else{doDel();haptic("medium");}}}>×</button></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><F_ k={"tr_orig_"+ti} label="Origem" val={tr.origem||""} onChange={(k,v)=>ut("origem",v)} styles={ST}/><F_ k={"tr_dest_"+ti} label="Destino" val={tr.destino||""} onChange={(k,v)=>ut("destino",v)} styles={ST}/></div>
<div style={{marginTop:10}}><F_ k={"tr_comp_"+ti} label="Comprimento (m)" val={tr.comprimento||""} onChange={(k,v)=>ut("comprimento",v)} styles={ST}/></div>
<div style={{marginTop:10,padding:10,background:dark?"rgba(0,0,0,0.2)":"rgba(255,255,255,0.5)",borderRadius:10,border:`1px dashed ${t.bd}`}}>
<div style={{fontSize:10,fontWeight:600,color:t.t2,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}><AppIcon name="📍" size={12} mr={4}/>Coordenadas GPS</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
<div><button type="button" style={{...bt,width:"100%",background:tr.gps_origem?t.successBgS:t.ac,color:tr.gps_origem?t.ok:"#fff",border:tr.gps_origem?`1.5px solid ${t.ok}`:"none",padding:"10px",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:5}} disabled={gpsLoading} onClick={async()=>{setGpsLoading(true);const gps=await captureGPS();setGpsLoading(false);if(gps){const v=`${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`;ut("gps_origem",v);haptic("heavy");showToast("✅ GPS Início: "+v);}else{showToast("📍 GPS indisponível");}}}><MapPin size={13}/>{tr.gps_origem?"✓ Início":"GPS Início"}</button>{tr.gps_origem&&<div style={{fontSize:10,color:t.t2,marginTop:4,fontFamily:"monospace",wordBreak:"break-all",lineHeight:1.3}}>{tr.gps_origem}<button type="button" style={{background:"none",border:"none",color:t.no,cursor:"pointer",fontSize:11,padding:"2px 4px",marginLeft:4,fontFamily:"inherit"}} onClick={()=>{ut("gps_origem","");haptic("light");}} title="Limpar GPS Início" aria-label="Limpar GPS Início">✕</button></div>}</div>
<div><button type="button" style={{...bt,width:"100%",background:tr.gps_destino?t.successBgS:t.no,color:tr.gps_destino?t.ok:"#fff",border:tr.gps_destino?`1.5px solid ${t.ok}`:"none",padding:"10px",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:5}} disabled={gpsLoading} onClick={async()=>{setGpsLoading(true);const gps=await captureGPS();setGpsLoading(false);if(gps){const v=`${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`;ut("gps_destino",v);haptic("heavy");showToast("✅ GPS Fim: "+v);}else{showToast("📍 GPS indisponível");}}}><MapPin size={13}/>{tr.gps_destino?"✓ Fim":"GPS Fim"}</button>{tr.gps_destino&&<div style={{fontSize:10,color:t.t2,marginTop:4,fontFamily:"monospace",wordBreak:"break-all",lineHeight:1.3}}>{tr.gps_destino}<button type="button" style={{background:"none",border:"none",color:t.no,cursor:"pointer",fontSize:11,padding:"2px 4px",marginLeft:4,fontFamily:"inherit"}} onClick={()=>{ut("gps_destino","");haptic("light");}} title="Limpar GPS Fim" aria-label="Limpar GPS Fim">✕</button></div>}</div>
</div>
</div><div style={{marginTop:10}}><Rd_ k={"tr_pad_"+ti} label="Padrão" opts={["Gotejamento","Escorrimento contínuo","Arrastamento","Borrifamento"]} val={tr.padrao||""} onChange={(k,v)=>ut("padrao",v)} styles={ST}/></div><div style={{marginTop:10}}><Rd_ k={"tr_cont_"+ti} label="Continuidade" opts={["Contínua","Intermitente","Com pontos de acúmulo"]} val={tr.continuidade||""} onChange={(k,v)=>ut("continuidade",v)} styles={ST}/></div><F_ k={"tr_dir_"+ti} label="Direcionamento (sentido das gotas)" type="textarea" val={tr.direcionamento||""} onChange={(k,v)=>ut("direcionamento",v)} styles={ST}/>{tr.origem&&tr.destino&&(()=>{const dash=tr.continuidade==="Intermitente"?"6 4":(tr.continuidade==="Com pontos de acúmulo"?"2 4":"0");const corP={"Gotejamento":"#dc3545","Escorrimento contínuo":"#a02020","Arrastamento":"#7d2424","Borrifamento":"#e74c3c"}[tr.padrao]||"#dc3545";return(<div style={{marginTop:10,padding:10,background:dark?"#0a0a0a":"#fafafa",borderRadius:8,border:`1px solid ${t.bd}`}}><div style={{fontSize:10,fontWeight:600,color:t.t2,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}><AppIcon name="📐" size={14} mr={4}/>Visualização</div><svg viewBox="0 0 320 80" style={{width:"100%",maxWidth:400,display:"block",margin:"0 auto"}}><rect x="4" y="22" width="80" height="36" rx="4" fill={dark?"#1a2332":"#e8f0ff"} stroke={t.ac} strokeWidth="1.2"/><text x="44" y="38" textAnchor="middle" fontSize="9" fontWeight="700" fill={t.ac}>ORIGEM</text><text x="44" y="50" textAnchor="middle" fontSize="8" fill={dark?"#aaa":"#333"}>{(tr.origem||"—").slice(0,14)}</text><line x1="86" y1="40" x2="234" y2="40" stroke={corP} strokeWidth="2.5" strokeDasharray={dash} strokeLinecap="round"/><polygon points="234,34 246,40 234,46" fill={corP}/>{tr.comprimento&&<text x="160" y="32" textAnchor="middle" fontSize="9" fontWeight="600" fill={corP}>{tr.comprimento}m</text>}{tr.padrao&&<text x="160" y="58" textAnchor="middle" fontSize="8" fill={dark?"#aaa":"#666"} fontStyle="italic">{tr.padrao}</text>}<rect x="248" y="22" width="68" height="36" rx="4" fill={dark?"#2a1a1a":"#fff5f5"} stroke={t.no} strokeWidth="1.2"/><text x="282" y="38" textAnchor="middle" fontSize="9" fontWeight="700" fill={t.no}>DESTINO</text><text x="282" y="50" textAnchor="middle" fontSize="8" fill={dark?"#aaa":"#333"}>{(tr.destino||"—").slice(0,12)}</text></svg></div>);})()}<details style={{marginTop:10}}><summary style={{fontSize:12,fontWeight:600,color:t.ac,cursor:"pointer"}}><AppIcon name="📍" size={14} mr={4}/>Pontos de acúmulo</summary><div style={{padding:8,marginTop:4}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><F_ k={"tr_acq_"+ti} label="Quantidade" val={tr.acumulo_qtd||""} onChange={(k,v)=>ut("acumulo_qtd",v)} styles={ST}/><Rd_ k={"tr_acv_"+ti} label="Volume" opts={["Pequeno","Moderado","Grande"]} val={tr.acumulo_vol||""} onChange={(k,v)=>ut("acumulo_vol",v)} styles={ST}/></div><F_ k={"tr_acl_"+ti} label="Localização" type="textarea" val={tr.acumulo_local||""} onChange={(k,v)=>ut("acumulo_local",v)} styles={ST}/></div></details>
<details style={{marginTop:10}}><summary style={{fontSize:12,fontWeight:600,color:t.ac,cursor:"pointer"}}><AppIcon name="🔎" size={14} mr={4}/>Indicadores de dinâmica</summary><div style={{padding:8,marginTop:4,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><SN_ k={"tr_peg_"+ti} label="Pegadas ensanguentadas?" val={tr.pegadas||""} onChange={(k,v)=>ut("pegadas",v)} styles={ST}/><SN_ k={"tr_arr_"+ti} label="Marcas de arrasto?" val={tr.arrasto||""} onChange={(k,v)=>ut("arrasto",v)} styles={ST}/><SN_ k={"tr_mao_"+ti} label="Impressões de mãos?" val={tr.maos||""} onChange={(k,v)=>ut("maos",v)} styles={ST}/><SN_ k={"tr_sat_"+ti} label="Gotas satélite?" val={tr.satelite||""} onChange={(k,v)=>ut("satelite",v)} styles={ST}/><SN_ k={"tr_dim_"+ti} label="Diminuição progressiva?" val={tr.diminuicao||""} onChange={(k,v)=>ut("diminuicao",v)} styles={ST}/></div></details>
<details style={{marginTop:10}}><summary style={{fontSize:12,fontWeight:600,color:t.ac,cursor:"pointer"}}><AppIcon name="🌧️" size={14} mr={4}/>Relação com ambiente</summary><div style={{padding:8,marginTop:4,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><SN_ k={"tr_dil_"+ti} label="Diluição água/chuva?" val={tr.diluicao||""} onChange={(k,v)=>ut("diluicao",v)} styles={ST}/><SN_ k={"tr_int_"+ti} label="Interferência terceiros?" val={tr.interferencia||""} onChange={(k,v)=>ut("interferencia",v)} styles={ST}/></div>{tr.interferencia==="Sim"&&<F_ k={"tr_into_"+ti} label="Obs interferência" val={tr.interferencia_obs||""} onChange={(k,v)=>ut("interferencia_obs",v)} styles={ST}/>}</details>
<F_ k={"tr_obs_"+ti} label="Obs trilha" type="textarea" val={tr.obs||""} onChange={(k,v)=>ut("obs",v)} styles={ST}/></div>)})}
<button type="button" style={abtn} onClick={()=>setTrilhas([...trilhas,{id:uid(),origem:"",destino:"",gps_origem:"",gps_destino:"",comprimento:"",padrao:"",continuidade:"",direcionamento:"",acumulo_qtd:"",acumulo_local:"",acumulo_vol:"",pegadas:"",arrasto:"",maos:"",satelite:"",diminuicao:"",diluicao:"",interferencia:"",interferencia_obs:"",obs:""}])}>+ Trilha de sangue</button></Cd_>
</>}{g("dest")==="Área verde"&&<Cd_ styles={ST} title="Área Verde — Vegetação" aria-label="Área Verde — Vegetação" icon="🌳" variant="teal"><div style={{display:"flex",alignItems:"center",gap:4,marginBottom:8}}><span style={{fontSize:11,fontWeight:500,color:t.t2}}>Características da vegetação</span><FotoBtn rk="av_vegetacao"/></div><div style={{display:"flex",flexDirection:"column",gap:12}}><Rd_ k="av_veg" label="Tipo de vegetação" opts={["Gramínea e rasteira","Médio porte","Grande porte"]} val={g("av_veg")} onChange={s} styles={ST}/><F_ k="av_obs" label="Obs área verde" type="textarea" val={g("av_obs")} onChange={s} styles={ST}/></div></Cd_>}
<Cd_ styles={ST} title="Edificações" aria-label="Edificações" icon="🏠" variant="primary">{edificacoes.map((e,i)=>{const ue=(k2,v2)=>{setEdificacoes(prev=>prev.map((e2,j)=>j===i?{...e2,[k2]:v2}:e2));};const tgCom=(c)=>{const arr=e.comodos_list||[];const idx=arr.indexOf(c);const n2=idx>-1?arr.filter(x=>x!==c):[...arr,c];ue("comodos_list",n2);};const isCollapsed=edifCollapsed[e.id];return(<div key={e.id} style={{background:t.bg3,borderRadius:12,padding:14,marginBottom:10,border:`1.5px solid ${t.bd}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setEdifCollapsed(p=>({...p,[e.id]:!p[e.id]}))}><span style={{fontSize:13,fontWeight:700,color:t.tx}}>Edificação {i+1}{e.tipo?" — "+e.tipo:""}</span><span style={{fontSize:16,color:t.t3}}>{isCollapsed?"▶":"▼"}</span></div>{!isCollapsed&&<div style={{marginTop:10}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><FotoBtn rk={"edif_"+e.id}/>{edificacoes.length>1&&<button type="button" style={{background:"rgba(255,59,48,0.12)",border:`1.5px solid ${t.no}`,color:t.no,cursor:"pointer",fontSize:20,fontWeight:700,borderRadius:10,padding:"4px 12px",minWidth:40,minHeight:44,lineHeight:1,fontFamily:"inherit"}} title="Remover edificação" aria-label="Remover edificação" onClick={()=>{const hasData=!!(e.tipo||e.nome||e.material||e.andares||(e.comodos_list&&e.comodos_list.length)||(e.comodos_fato&&e.comodos_fato.length));const doDel=()=>setEdificacoes(edificacoes.filter((_,j)=>j!==i));if(hasData){reqDel(`Remover Edificação ${i+1}?`,e.tipo?`Tipo: ${e.tipo}${e.nome?" — "+e.nome:""}`:"(edificação com dados)",doDel);}else{doDel();haptic("medium");}}}>×</button>}</div>

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
<div><label style={lb}>Tipo</label><select style={sel} value={e.tipo||""} onChange={ev=>ue("tipo",ev.target.value)}><option value=""></option><option>Casa</option><option>Apartamento</option><option>Sobrado</option><option>Barraco/Casebre</option><option>Comércio/Loja</option><option>Galpão</option><option>Prédio</option><option>Kitnet</option><option>Chácara/Sítio</option><option>Outro</option></select></div>
<div><label style={lb}>Material</label><select style={sel} value={e.material||""} onChange={ev=>ue("material",ev.target.value)}><option value=""></option><option>Alvenaria</option><option>Madeira</option><option>Misto</option><option>Outro</option></select></div>
</div>

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
<div><label style={lb}>Andares</label><select style={sel} value={e.andares||""} onChange={ev=>ue("andares",ev.target.value)}><option value=""></option><option>Térreo</option><option>1 andar</option><option>2 andares</option><option>3+ andares</option></select></div>
<div><label style={lb}>Cobertura</label><select style={sel} value={e.cobertura||""} onChange={ev=>ue("cobertura",ev.target.value)}><option value=""></option><option>Laje</option><option>Telha</option><option>Zinco/Fibrocimento</option><option>Sem cobertura</option><option>Outro</option></select></div>
<div><label style={lb}>Estado</label><select style={sel} value={e.estado||""} onChange={ev=>ue("estado",ev.target.value)}><option value=""></option><option>Bom</option><option>Regular</option><option>Precário</option><option>Em construção</option><option>Abandonado</option></select></div>
</div>

<div style={{marginBottom:10}}><label style={lb}>Perímetro / Cercamento</label>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
<select style={sel} value={e.muro||""} onChange={ev=>ue("muro",ev.target.value)}><option value=""></option><option>Muro alvenaria</option><option>Grade/Ferro</option><option>Cerca arame</option><option>Cerca madeira</option><option>Sem cercamento</option><option>Outro</option></select>
<select style={sel} value={e.portao||""} onChange={ev=>ue("portao",ev.target.value)}><option value=""></option><option>Aberto</option><option>Fechado</option><option>Trancado</option><option>Arrombado</option><option>Sem portão</option></select>
</div></div>

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
<div><label style={lb}>Acesso principal</label><select style={sel} value={e.acesso||""} onChange={ev=>ue("acesso",ev.target.value)}><option value=""></option><option>Porta aberta</option><option>Porta fechada (sem chave)</option><option>Porta trancada</option><option>Porta arrombada</option><option>Sem porta</option><option>Janela</option><option>Outro</option></select></div>
<div><label style={lb}>Nº entradas/saídas</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={inp} type="number" defaultValue={e.n_entradas||""} onBlur={ev=>ue("n_entradas",ev.target.value)}/></div>
</div>

{(()=>{const baseRooms=["Sala","Quarto 1","Quarto 2","Suíte 1","Suíte 2","Cozinha","Banheiro 1","Banheiro 2","Área de serviço","Garagem","Quintal","Varanda","Corredor","Terraço","Escada","Área externa"];
/* v201: cômodos extras digitados pelo usuário aparecem nas duas listas como chips */
const extras=Array.from(new Set([...(e.comodos_list||[]),...(e.comodos_fato||[])].filter(x=>x&&!baseRooms.includes(x))));
const allRooms=[...baseRooms,...extras];
/* v201: addExtraRoom adiciona em comodos_list (sempre) e em comodos_fato (pré-selecionado).
   Estado é atualizado em uma só passada para evitar perda de updates */
const addExtraRoom=(nv)=>{if(!nv)return;const arr1=e.comodos_list||[];const arr2=e.comodos_fato||[];const next1=arr1.includes(nv)?arr1:[...arr1,nv];const next2=arr2.includes(nv)?arr2:[...arr2,nv];setEdificacoes(prev=>prev.map((e2,j)=>j===i?{...e2,comodos_list:next1,comodos_fato:next2}:e2));haptic("light");};
return(<>
<div style={{marginBottom:10}}><label style={{...lb,marginBottom:8}}>Cômodos identificados</label>
<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{allRooms.map(c=>{const sel2=(e.comodos_list||[]).includes(c);return <button type="button" key={c} style={ch(sel2)} onClick={()=>tgCom(c)}>{c}</button>;})}
</div>
{/* v201: input "Outro cômodo" foi movido pra cá (era em "Cômodo do fato"). Adiciona em ambas as listas */}
<div style={{display:"flex",gap:6,alignItems:"center",marginTop:8}}><input autoComplete="off" autoCorrect="off" spellCheck={false} style={{...inp,flex:1,fontSize:12}} placeholder="Outro cômodo (digitar)" onKeyDown={ev=>{if(ev.key==="Enter"&&ev.target.value.trim()){addExtraRoom(ev.target.value.trim());ev.target.value="";}}} onBlur={ev=>{if(ev.target.value.trim()){addExtraRoom(ev.target.value.trim());ev.target.value="";}}}/><span style={{fontSize:10,color:t.t3,flexShrink:0}}>Enter p/ add</span></div>
<div style={{fontSize:10,color:t.t3,marginTop:4,fontStyle:"italic"}}>O cômodo extra entra aqui e já fica pré-selecionado no <b>Cômodo do fato</b> abaixo.</div>
</div>
<div style={{marginBottom:10}}><label style={{...lb,marginBottom:8}}>Cômodo(s) do fato</label>
<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{allRooms.map(c=>{const sel2=(e.comodos_fato||[]).includes(c);return <button type="button" key={c} style={{...ch(sel2),borderColor:sel2?"#ff3b30":t.bd,color:sel2?"#ff3b30":t.t2,background:sel2?"rgba(255,59,48,0.1)":"transparent"}} onClick={()=>{const arr=e.comodos_fato||[];const idx=arr.indexOf(c);ue("comodos_fato",idx>-1?arr.filter(x=>x!==c):[...arr,c]);}}>{c}</button>;})}
</div>
</div>
</>);})()}
{(e.comodos_fato||[]).length>0&&<div style={{marginBottom:10}}>{(e.comodos_fato||[]).map(cf=>{const det=(e.comodos_fato_det||{})[cf]||{};const ueDet=(k2,v2)=>{const d2={...(e.comodos_fato_det||{})};d2[cf]={...(d2[cf]||{}), [k2]:v2};ue("comodos_fato_det",d2);};return(<div key={cf} style={{background:dark?"#1a1a1a":"#fafafa",border:`1px solid ${dark?"#333":"#ddd"}`,borderRadius:10,padding:12,marginBottom:8}}>
<div style={{fontSize:13,fontWeight:700,color:t.no,marginBottom:8,display:"flex",alignItems:"center"}}>📍 {cf}<FotoBtn rk={"comodo_"+i+"_"+cf}/></div>
<div style={{marginBottom:8}}><label style={lb}>Estado</label><select style={sel} value={det.estado||""} onChange={ev=>ueDet("estado",ev.target.value)}><option value=""></option><option>Normal/Organizado</option><option>Revirado/Bagunçado</option><option>Com sangue</option><option>Incendiado</option><option>Outro</option></select></div>
<details><summary style={{fontSize:11,fontWeight:600,color:t.ac,cursor:"pointer",padding:"4px 0"}}>🩸 Manchas de sangue — {cf}</summary><div style={{padding:8,background:dark?"#1a1010":"#fff5f5",borderRadius:8,border:`1px solid ${dark?"#442222":"#ffcccc"}`,marginTop:4}}>
{[["mr","Regulares",["Gotejadas","Projetadas","Cast-off","Impactadas"]],["mi","Irregulares",["Contato","Transferidas","Alter. contato"]],["ma","Alteradas",["Sombra","Diluição"]],["mac","Acúmulo",["Sangue s. sangue","Poça","Saturação"]],["me","Escorrimento",["Escorrimento"]],["mo","Outras",["Geral","Trilha"]]].map(([mk,ml,mopts])=>{const mv=det[mk]||[];return(<div key={mk} style={{marginBottom:6}}><label style={{...lb,fontSize:12}}>{ml}</label><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{mopts.map(o=>{const s2=mv.includes(o);return <button type="button" key={o} style={{...ch(s2),fontSize:11,padding:"4px 10px"}} onClick={()=>{const a2=[...mv];const ix=a2.indexOf(o);ueDet(mk,ix>-1?a2.filter(x=>x!==o):[...a2,o]);}}>{o}</button>;})}
</div></div>);})}
<div style={{marginTop:8}}><label style={{...lb,fontSize:12}}>Obs manchas</label><TX_ value={det.obs_manchas||""} placeholder="Observações sobre manchas" inputStyle={{...inp,fontSize:12}} onCommit={(val)=>ueDet("obs_manchas",val)}/></div>
</div></details>
<div style={{marginTop:8}}><label style={{...lb,fontSize:12}}>Observações — {cf}</label><TX_ value={det.obs_comodo||""} placeholder="Observações do cômodo" inputStyle={{...inp,fontSize:12}} onCommit={(val)=>ueDet("obs_comodo",val)}/></div>
</div>);})}
</div>}

<div style={{marginBottom:10}}><label style={lb}>Vizinhança</label>
<select style={sel} value={e.vizinhanca||""} onChange={ev=>ue("vizinhanca",ev.target.value)}><option value=""></option><option>Casas coladas</option><option>Lote isolado</option><option>Condomínio fechado</option><option>Conjunto habitacional</option><option>Invasão/Ocupação</option><option>Zona rural</option><option>Outro</option></select>
</div>

<div style={{marginBottom:8}}><label style={lb}>Descrição / Endereço complementar</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={inp} defaultValue={e.nome} onBlur={ev=>ue("nome",ev.target.value)}/></div>
<div><F_ k={"eobs_"+e.id} label={`Observações — Edificação ${i+1}`} type="textarea" val={e.obs||""} onChange={(_k,val)=>ue("obs",val)} styles={ST}/></div>
</div>}</div>);})}
<button type="button" style={abtn} onClick={()=>setEdificacoes([...edificacoes,mkEdif(Date.now())])}>+ Edificação</button></Cd_>
<Cd_ styles={ST} title="Observações" aria-label="Observações" icon="📝"><F_ k="obs_l" label="Observações gerais — Local do Fato" type="textarea" val={g("obs_l")} onChange={s} styles={ST}/></Cd_>
{navBtns()}</>);

  // ╔════════════════════════════════════════╗
  // ║  ABA 2 — VESTÍGIOS + PAPILOSCOPIA      ║
  // ╚════════════════════════════════════════╝
if(tab===TAB_VESTIGIOS)return(<><Cd_ styles={ST} title="Vestígios" aria-label="Vestígios" icon="🧪" variant="primary">{(()=>{const counts={all:vestigios.length,ic:vestigios.filter(v=>(v.destino||"").includes("IC")).length,ii:vestigios.filter(v=>(v.destino||"").includes("II")).length,none:vestigios.filter(v=>!(v.destino||"")).length};const chips=[["all","Todos",counts.all,t.ac],["ic","IC",counts.ic,"#007aff"],["ii","II",counts.ii,"#ff9500"],["none","Sem dest.",counts.none,t.no]];return(<div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>{chips.map(([id,lbl,n,c])=>{const on=vestFilter===id;const disabled=n===0&&id!=="all";return <button type="button" key={id} disabled={disabled} onClick={()=>{setVestFilter(id);haptic("selection");}} style={{padding:"6px 11px",fontSize:12,fontWeight:on?700:500,borderRadius:100,border:`1.5px solid ${on?c:t.bd}`,background:on?`${c}22`:"transparent",color:on?c:(disabled?t.t3:t.t2),cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",opacity:disabled?0.4:1,display:"inline-flex",alignItems:"center",gap:5,fontVariantNumeric:"tabular-nums"}}>{lbl}<span style={{background:on?c:(dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)"),color:on?"#fff":t.t2,fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10,minWidth:16,textAlign:"center"}}>{n}</span></button>;})}{vestigios.length>1&&<button type="button" onClick={()=>{setVestCompact(v=>!v);setExpandedVest({});haptic("selection");}} title={vestCompact?"Expandir todos":"Compactar lista"} style={{marginLeft:"auto",padding:"6px 10px",fontSize:12,fontWeight:600,borderRadius:100,border:`1.5px solid ${vestCompact?t.ac:t.bd}`,background:vestCompact?(dark?"rgba(10,132,255,0.18)":"rgba(0,122,255,0.10)"):"transparent",color:vestCompact?t.ac:t.t2,cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:4}}>{vestCompact?<><AppIcon name="📂" size={12} mr={3}/>Expandir</>:<><AppIcon name="✨" size={12} mr={3}/>Compactar</>}</button>}</div>);})()}{vestigios.map((v,i)=>{const destColor=(v.destino||"").includes("IC")?"#007aff":(v.destino||"").includes("II")?"#ff9500":t.bd;const matchesFilter=vestFilter==="all"||(vestFilter==="ic"&&(v.destino||"").includes("IC"))||(vestFilter==="ii"&&(v.destino||"").includes("II"))||(vestFilter==="none"&&!(v.destino||""));if(!matchesFilter)return null;const isCollapsed=vestCompact&&!expandedVest[v.id];if(isCollapsed)return(<div key={v.id} onClick={()=>{setExpandedVest(p=>({...p,[v.id]:true}));haptic("selection");}} style={{background:t.bg3,borderRadius:10,padding:"10px 12px",marginBottom:6,border:`0.5px solid ${t.bd}`,borderLeft:`4px solid ${destColor}`,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:12,fontWeight:700,color:t.ac,minWidth:24,fontVariantNumeric:"tabular-nums"}}>{i+1}.</span><span style={{flex:1,fontSize:13,color:t.tx,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.desc||<i style={{color:t.t3}}>sem descrição</i>}{v.placa&&<span style={{marginLeft:6,fontSize:10,fontWeight:700,background:"rgba(255,215,0,0.2)",color:dark?"#ffd60a":"#b08800",padding:"1px 6px",borderRadius:8,fontVariantNumeric:"tabular-nums"}}>🏷️ {v.placa}</span>}</span>{v.destino&&<span style={{fontSize:10,fontWeight:700,color:destColor,background:`${destColor}18`,padding:"2px 7px",borderRadius:6}}>{v.destino}</span>}{v.recolhido==="Sim"&&<span style={{fontSize:10,color:t.ok,fontWeight:700}}>✓</span>}<span style={{fontSize:14,color:t.t3}}>›</span></div>);return(<div key={v.id} style={{background:t.bg3,borderRadius:10,padding:12,marginBottom:8,border:`0.5px solid ${t.bd}`,borderLeft:`4px solid ${destColor}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:13,fontWeight:600,color:t.ac,display:"inline-flex",alignItems:"center",gap:6}}>Vestígio {i+1}{vestCompact&&<button type="button" onClick={()=>setExpandedVest(p=>{const n={...p};delete n[v.id];return n;})} style={{background:"transparent",border:"none",color:t.t3,cursor:"pointer",fontSize:11,padding:"2px 6px",fontFamily:"inherit"}}>▲ fechar</button>}</span><div style={{display:"flex",alignItems:"center",gap:4}}><FotoBtn rk={"vest_"+v.id}/><button type="button" style={{background:"transparent",border:`1.5px solid ${t.ac}`,color:t.ac,cursor:"pointer",borderRadius:10,padding:"4px 12px",minWidth:40,minHeight:44,display:"inline-flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}} title="Duplicar este vestígio (cópia integral)" aria-label="Duplicar este vestígio (cópia integral)" onClick={()=>{setVestigios(prev=>{const idx=prev.findIndex(x=>x.id===v.id);const nv={...v,id:uid()};return[...prev.slice(0,idx+1),nv,...prev.slice(idx+1)];});haptic("light");showToast("📋 Vestígio duplicado");}}><Copy size={16} strokeWidth={2.2}/></button><button type="button" style={{background:"rgba(255,59,48,0.12)",border:`1.5px solid ${t.no}`,color:t.no,cursor:"pointer",fontSize:20,fontWeight:700,borderRadius:10,padding:"4px 12px",minWidth:40,minHeight:44,lineHeight:1,fontFamily:"inherit"}} title="Remover vestígio" aria-label="Remover vestígio" onClick={()=>{setVestigios(vestigios.filter((_,j)=>j!==i));haptic("medium");}}>×</button></div></div><div><label style={lb}>Descrição</label><VestPk val={v.desc} onSelect={val2=>{setVestigios(prev=>prev.map((v,j)=>j===i?{...v,desc:val2}:v));}} styles={ST}/><TX_ inputKey={"desc-"+v.id+"-"+(v.desc||"")} value={v.desc} placeholder="Descrição do vestígio" inputStyle={inp} onCommit={(val)=>{setVestigios(prev=>prev.map((v,j)=>j===i?{...v,desc:val}:v));}}/></div><div style={{marginTop:8}}><label style={lb}>Suporte / Local</label><TX_ value={v.suporte} inputStyle={inp} onCommit={(val)=>{setVestigios(prev=>prev.map((v,j)=>j===i?{...v,suporte:val}:v));}}/></div>{v.placa&&<div style={{marginTop:6,fontSize:11,color:t.t2,lineHeight:1.4,background:dark?"rgba(255,215,0,0.08)":"rgba(255,215,0,0.12)",border:`1px solid ${dark?"rgba(255,215,0,0.25)":"rgba(212,160,23,0.35)"}`,borderRadius:8,padding:"6px 10px"}}><AppIcon name="🏷️" size={14} mr={4}/>No PDF/RRV: <b>"{v.suporte||"___"} — Vestígio correlacionado à placa {v.placa}"</b></div>}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:8}}><div><label style={lb}>Dist. 1</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={{...inp,fontSize:12}} defaultValue={v.coord1} onBlur={e=>{setVestigios(prev=>prev.map((v,j)=>j===i?{...v,coord1:e.target.value}:v));}}/></div><div><label style={lb}>Dist. 2</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={{...inp,fontSize:12}} defaultValue={v.coord2} onBlur={e=>{setVestigios(prev=>prev.map((v,j)=>j===i?{...v,coord2:e.target.value}:v));}}/></div><div><label style={lb}>Altura</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={{...inp,fontSize:12}} defaultValue={v.altura} onBlur={e=>{setVestigios(prev=>prev.map((v,j)=>j===i?{...v,altura:e.target.value}:v));}}/></div></div><div style={{display:"grid",gridTemplateColumns:"auto 1fr 1fr",gap:8,marginTop:8,alignItems:"end"}}><div><label style={lb}>Recolhido?</label><div style={{display:"flex"}}><button type="button" style={tY(v.recolhido==="Sim")} onClick={()=>{setVestigios(prev=>prev.map((v,j)=>j===i?{...v,recolhido:"Sim"}:v));}}>S</button><button type="button" style={tN(v.recolhido==="Não")} onClick={()=>{setVestigios(prev=>prev.map((v,j)=>j===i?{...v,recolhido:"Não"}:v));}}>N</button></div></div><div><label style={lb}>Destino</label><div style={{display:"flex",gap:4}}>{["IC","II"].map(dd=>{const ds=(v.destino||"").split("+").filter(Boolean);const isOn=ds.includes(dd);return <button type="button" key={dd} style={{padding:"7px 14px",fontSize:13,borderRadius:8,border:`1.5px solid ${isOn?"#007aff":t.bd}`,background:isOn?"rgba(0,122,255,0.12)":"transparent",color:isOn?"#007aff":t.t3,cursor:"pointer",fontFamily:"inherit",fontWeight:isOn?600:400}} onClick={()=>{setVestigios(prev=>prev.map((v,j)=>{if(j!==i)return v;const ds2=(v.destino||"").split("+").filter(Boolean);const idx2=ds2.indexOf(dd);return{...v,destino:idx2>-1?ds2.filter(x=>x!==dd).join("+"):[...ds2,dd].join("+")};}));}}>{dd}</button>;})}</div></div><div><label style={lb}>Placa</label><select style={{...sel,fontSize:13}} value={v.placa||""} onChange={e=>{setVestigios(prev=>prev.map((vv,j)=>j===i?{...vv,placa:e.target.value}:vv));haptic("selection");}}><option value=""></option>{Array.from({length:99},(_,n)=>{const num=String(n+1).padStart(2,"0");return <option key={num} value={num}>{num}</option>;})}
</select></div></div><div style={{marginTop:8}}><F_ k={"vobs_"+v.id} label={`Observações — Vestígio ${i+1}`} type="textarea" val={v.obs||""} onChange={(_k,val)=>{setVestigios(prev=>prev.map((v2,j)=>j===i?{...v2,obs:val}:v2));}} styles={ST}/></div></div>)})}{vestigios.length>0&&(()=>{const anyMatch=vestigios.some(v=>vestFilter==="all"||(vestFilter==="ic"&&(v.destino||"").includes("IC"))||(vestFilter==="ii"&&(v.destino||"").includes("II"))||(vestFilter==="none"&&!(v.destino||"")));return !anyMatch&&<div style={{padding:"20px 16px",textAlign:"center",color:t.t2,fontSize:13,background:dark?"#1a1a1a":"#fafafa",borderRadius:10,marginBottom:8,border:`1px dashed ${t.bd}`}}><AppIcon name="🔍" size={14} mr={4}/>Nenhum vestígio corresponde ao filtro<br/><button type="button" onClick={()=>setVestFilter("all")} style={{marginTop:6,background:"transparent",color:t.ac,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,padding:6,fontFamily:"inherit"}}>Mostrar todos</button></div>;})()}{vestigios.length===0&&<EmptyState icon="🧪" title="Nenhum vestígio cadastrado" aria-label="Nenhum vestígio cadastrado" hint="Toque em + Vestígio abaixo para adicionar" accent="#007aff" dark={dark}/>}<button type="button" style={abtn} onClick={()=>setVestigios([...vestigios,{id:uid(),desc:"",suporte:"",coord1:"",coord2:"",altura:"",recolhido:"",destino:"",obs:"",placa:""}])}>+ Vestígio</button></Cd_>
<Cd_ styles={ST} title="Obs" aria-label="Obs" icon="📝" variant="slate"><F_ k="obs_v" label="Observações gerais — Vestígios" type="textarea" val={g("obs_v")} onChange={s} styles={ST}/></Cd_>
<Cd_ styles={ST} title="Papiloscopia" aria-label="Papiloscopia" icon="🖐️" variant="teal">{papilos.map((p,i)=>{const isCollapsedP=vestCompact&&!expandedVest["p_"+p.id];if(isCollapsedP)return(<div key={p.id} onClick={()=>{setExpandedVest(pp=>({...pp,["p_"+p.id]:true}));haptic("selection");}} style={{background:t.bg3,borderRadius:10,padding:"10px 12px",marginBottom:6,border:`0.5px solid ${t.bd}`,borderLeft:`4px solid #30b0c7`,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:12,fontWeight:700,color:"#30b0c7",minWidth:24,fontVariantNumeric:"tabular-nums"}}>{i+1}.</span><span style={{flex:1,fontSize:13,color:t.tx,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.desc||<i style={{color:t.t3}}>sem descrição</i>}{p.placa&&<span style={{marginLeft:6,fontSize:10,fontWeight:700,background:"rgba(255,215,0,0.2)",color:dark?"#ffd60a":"#b08800",padding:"1px 6px",borderRadius:8,fontVariantNumeric:"tabular-nums"}}>🏷️ {p.placa}</span>}</span>{p.local&&<span style={{fontSize:10,color:t.t2,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.local}</span>}<span style={{fontSize:14,color:t.t3}}>›</span></div>);return(<div key={p.id} style={{background:t.bg3,borderRadius:10,padding:10,marginBottom:6,border:`0.5px solid ${t.bd}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:13,fontWeight:600,color:t.ac,display:"inline-flex",alignItems:"center",gap:6}}>Papilo {i+1}{vestCompact&&<button type="button" onClick={()=>setExpandedVest(pp=>{const nx={...pp};delete nx["p_"+p.id];return nx;})} style={{background:"transparent",border:"none",color:t.t3,cursor:"pointer",fontSize:11,padding:"2px 6px",fontFamily:"inherit"}}>▲ fechar</button>}</span><div style={{display:"flex",alignItems:"center",gap:4}}><FotoBtn rk={"papilo_"+p.id}/><button type="button" style={{background:"transparent",border:`1.5px solid ${t.ac}`,color:t.ac,cursor:"pointer",borderRadius:10,padding:"4px 12px",minWidth:40,minHeight:44,display:"inline-flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}} title="Duplicar este papilo (cópia integral)" aria-label="Duplicar este papilo (cópia integral)" onClick={()=>{setPapilos(prev=>{const idx=prev.findIndex(x=>x.id===p.id);const np={...p,id:uid()};return[...prev.slice(0,idx+1),np,...prev.slice(idx+1)];});haptic("light");showToast("📋 Papilo duplicado");}}><Copy size={16} strokeWidth={2.2}/></button><button type="button" style={{background:"rgba(255,59,48,0.12)",border:`1.5px solid ${t.no}`,color:t.no,cursor:"pointer",fontSize:20,fontWeight:700,borderRadius:10,padding:"4px 12px",minWidth:40,minHeight:44,lineHeight:1,fontFamily:"inherit"}} title="Remover papilo" aria-label="Remover papilo" onClick={()=>{setPapilos(papilos.filter((_,j)=>j!==i));haptic("medium");}}>×</button></div></div><div><label style={{...lb,fontSize:12}}>Vestígio</label><select style={{...sel,marginBottom:4,fontSize:12}} value={["Arma de fogo","Caneca","Carteira de cigarro","Celular","Copo de plástico","Copo de vidro","Documento","Embalagem plástica","Espelho/vidro","Faca","FIP","FIP's","Fita adesiva","Garrafa de vidro","Garrafa PET","Lata de alumínio","Munição","Papel","Sacola plástica"].includes(p.desc)?p.desc:""} onChange={e2=>{setPapilos(prev=>prev.map((p,j)=>j===i?{...p,desc:e2.target.value}:p));}}><option value=""></option><option>Arma de fogo</option><option>Caneca</option><option>Carteira de cigarro</option><option>Celular</option><option>Copo de plástico</option><option>Copo de vidro</option><option>Documento</option><option>Embalagem plástica</option><option>Espelho/vidro</option><option>Faca</option><option>FIP</option><option>FIP's</option><option>Fita adesiva</option><option>Garrafa de vidro</option><option>Garrafa PET</option><option>Lata de alumínio</option><option>Munição</option><option>Papel</option><option>Sacola plástica</option></select><TX_ value={p.desc} placeholder="Editar / complementar" inputStyle={{...inp,fontSize:13}} onCommit={(val)=>{setPapilos(prev=>prev.map((p,j)=>j===i?{...p,desc:val}:p));}}/></div><div style={{marginTop:8}}><label style={{...lb,fontSize:12}}>Local</label><TX_ value={p.local} inputStyle={{...inp,fontSize:13}} onCommit={(val)=>{setPapilos(prev=>prev.map((p,j)=>j===i?{...p,local:val}:p));}}/></div><div style={{marginTop:8,maxWidth:160}}><label style={{...lb,fontSize:12}}>Placa</label><select style={{...sel,fontSize:13}} value={p.placa||""} onChange={e=>{setPapilos(prev=>prev.map((pp,j)=>j===i?{...pp,placa:e.target.value}:pp));haptic("selection");}}><option value=""></option>{Array.from({length:99},(_,n)=>{const num=String(n+1).padStart(2,"0");return <option key={num} value={num}>{num}</option>;})}
</select>{p.placa&&<div style={{marginTop:6,fontSize:11,color:t.t2,lineHeight:1.4,background:dark?"rgba(255,215,0,0.08)":"rgba(255,215,0,0.12)",border:`1px solid ${dark?"rgba(255,215,0,0.25)":"rgba(212,160,23,0.35)"}`,borderRadius:8,padding:"6px 10px"}}><AppIcon name="🏷️" size={14} mr={4}/>No PDF/RRV: <b>"{p.local||"___"} — Vestígio correlacionado à placa {p.placa}"</b></div>}</div></div>);})}{papilos.length===0&&<EmptyState icon="🖐️" title="Nenhum vestígio papiloscópico" aria-label="Nenhum vestígio papiloscópico" hint="Toque em + Vestígio papiloscopia abaixo" accent="#30b0c7" dark={dark}/>}<button type="button" style={abtn} onClick={()=>setPapilos([...papilos,{id:uid(),desc:"",local:"",placa:""}])}>+ Vestígio papiloscopia</button><div style={{marginTop:12}}><F_ k="obs_p" label="Obs papiloscopia" type="textarea" val={g("obs_p")} onChange={s} styles={ST}/></div></Cd_>
{navBtns()}</>);
  // ╔════════════════════════════════════════╗
  // ║  ABA 3 — CADÁVER (corpo, lesões, fenôm)║
  // ╚════════════════════════════════════════╝
if(tab===TAB_CADAVER)return(<><Cd_ styles={ST} title="Cadáveres" aria-label="Cadáveres" icon="💀" variant="slate"><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}><div style={segContainer}>{cadaveres.map((c,i)=><button type="button" key={c.id} style={segTab(cadaverIdx===i)} onClick={()=>setCadaverIdx(i)}>{c.label}</button>)}</div><div style={{display:"flex",gap:4,alignItems:"center"}}><FotoBtn rk={"cad_"+cadaveres[cadaverIdx]?.id}/>{cadaveres.length>1&&<button type="button" style={{background:"rgba(255,59,48,0.12)",border:`1.5px solid ${t.no}`,color:t.no,cursor:"pointer",fontSize:16,fontWeight:700,borderRadius:8,padding:"6px 10px",minWidth:44,minHeight:44,lineHeight:1,fontFamily:"inherit"}} title="Remover cadáver atual" aria-label="Remover cadáver atual" onClick={()=>{const i=cadaverIdx;setCadaveres(cadaveres.filter((_,j)=>j!==i));setCadaverIdx(Math.max(0,Math.min(cadaverIdx,cadaveres.length-2)));setWounds(wounds.filter(w=>w.cadaver!==i).map(w=>w.cadaver>i?{...w,cadaver:w.cadaver-1}:w));}}>×</button>}<button type="button" style={{...abtn,width:"auto",padding:"8px 14px",fontSize:13}} onClick={()=>{setCadaveres([...cadaveres,{id:uid(),label:`Cadáver ${cadaveres.length+1}`}]);setCadaverIdx(cadaveres.length);}}>+ Cadáver</button></div></div></Cd_>
<div key={cadaverIdx}><Cd_ styles={ST} title="Descrição" aria-label="Descrição" icon="👤" variant="primary"><div style={{display:"flex",alignItems:"center",gap:4,marginBottom:8,flexWrap:"wrap"}}><span style={{fontSize:11,fontWeight:500,color:t.t2}}>Descrição do cadáver</span><FotoBtn rk={"cad_desc_"+cadaverIdx}/></div><div style={{marginBottom:14,padding:"10px 12px",background:t.dangerBgS,border:`1.5px solid ${g(cx+"avancado_decomp")?"#a02020":t.bd}`,borderRadius:10,display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer"}} onClick={()=>{const next=!g(cx+"avancado_decomp");if(next){setData(prev=>({...prev,[cx+"avancado_decomp"]:true,[cx+"fx"]:"Prejudicado",[cx+"et"]:"Prejudicado",[cx+"sx"]:prev[cx+"sx"]||"Prejudicado",[cx+"cp"]:"Prejudicada",[cx+"dg"]:prev[cx+"dg"]||"Cadáver em avançado estágio de decomposição (não recente)",[cx+"cu"]:prev[cx+"cu"]||"Prejudicado",[cx+"cl"]:prev[cx+"cl"]||"Prejudicado",[cx+"rm"]:prev[cx+"rm"]||"Prejudicada",[cx+"rs"]:prev[cx+"rs"]||"Prejudicada",[cx+"ri"]:prev[cx+"ri"]||"Prejudicada",[cx+"lv"]:prev[cx+"lv"]||"Prejudicado",[cx+"lc"]:prev[cx+"lc"]||"Prejudicado",[cx+"sn"]:prev[cx+"sn"]||"Prejudicado",[cx+"so"]:prev[cx+"so"]||"Prejudicado",[cx+"sg"]:prev[cx+"sg"]||"Prejudicado",[cx+"sa"]:prev[cx+"sa"]||"Prejudicado",[cx+"mva"]:prev[cx+"mva"]||"Prejudicada"}));}else{setData(prev=>({...prev,[cx+"avancado_decomp"]:false}));}}}><div style={{width:22,height:22,borderRadius:4,border:`2px solid ${g(cx+"avancado_decomp")?"#a02020":t.bd}`,background:g(cx+"avancado_decomp")?"#a02020":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,color:"#fff",fontSize:14,fontWeight:700}}>{g(cx+"avancado_decomp")?"✓":""}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:g(cx+"avancado_decomp")?"#a02020":t.tx,marginBottom:2}}><AppIcon name="☠️" size={14} mr={4}/>Cadáver em avançado estágio de decomposição</div><div style={{fontSize:11,color:t.t2,lineHeight:1.4}}>Marque para auto-preencher faixa, etnia, compleição como "Prejudicado" e abrir o painel de achados de putrefação.</div></div></div><div style={{display:"flex",flexDirection:"column",gap:12}}><Rd_ k={cx+"fx"} label="Faixa Etária" opts={["Recém-nascido","Criança","Adolescente","Adulto","Idoso","Prejudicado"]} val={g(cx+"fx")} onChange={s} styles={ST}/><Rd_ k={cx+"et"} label="Etnia" opts={["Branco","Indígena","Negro","Oriental","Pardo","Prejudicado"]} val={g(cx+"et")} onChange={s} styles={ST}/><Rd_ k={cx+"sx"} label="Sexo" opts={["Masculino","Feminino","Prejudicado"]} val={g(cx+"sx")} onChange={s} styles={ST}/><Rd_ k={cx+"cp"} label="Compleição" opts={["Franzina","Normolínea","Prejudicada","Robusta"]} val={g(cx+"cp")} onChange={s} styles={ST}/><Rd_ k={cx+"pos"} label="Posição" opts={["Decúbito dorsal","Decúbito ventral","Decúbito lateral D","Decúbito lateral E","Sentado","Em pé","Outro"]} val={g(cx+"pos")} onChange={s} styles={ST}/>
</div></Cd_>
<Cd_ styles={ST} title="Diagnóstico" aria-label="Diagnóstico" icon="🔍" variant="warning"><div style={{display:"flex",alignItems:"center",gap:4,marginBottom:8}}><span style={{fontSize:11,fontWeight:500,color:t.t2}}>Diagnóstico</span><FotoBtn rk={"cad_diag_"+cadaverIdx}/></div><div style={{display:"flex",flexDirection:"column",gap:12}}><Rd_ k={cx+"dg"} label="Diagnóstico diferencial" opts={["Homicídio","Suicídio","Afogamento","MAN","Acidente","A esclarecer"]} val={g(cx+"dg")} onChange={s} styles={ST}/><Rd_ k={cx+"le"} label="Local do evento" opts={["A esclarecer","Local diverso","Local examinado"]} val={g(cx+"le")} onChange={s} styles={ST}/><Ck_ k={cx+"ins"} label="Instrumento" opts={["Arma de fogo","Inst. ação contund.","Inst. ação cortante","Inst. ação corto-cont.","Inst. const. mole","Inst. const. semi-ríg.","Inst. const. rígido","A esclarecer"]} val={data[cx+"ins"]} onChange={s} styles={ST}/><F_ k={cx+"ins_o"} label="Outro instrumento" val={g(cx+"ins_o")} onChange={s} styles={ST}/><Rd_ k={cx+"mom"} label="Momento do evento" opts={["A esclarecer","Não recente","Recente"]} val={g(cx+"mom")} onChange={s} styles={ST}/>

{g(cx+"dg")==="Suicídio"&&<>
<Rd_ k={cx+"sui_tipo"} label="Meio utilizado" opts={["Forca","Arma de fogo","Arma branca","Medicamento","Projeção","Outro"]} val={g(cx+"sui_tipo")} onChange={s} styles={ST}/>

{g(cx+"sui_tipo")==="Forca"&&<div style={{background:dark?"#1a1a2e":"#f0f0ff",borderRadius:10,padding:12,marginTop:8,border:`1px solid ${dark?"#2a2a4e":"#d0d0ff"}`}}>
<label style={{...lb,fontSize:12,marginBottom:10}}><AppIcon name="🪢" size={16} mr={5}/>Detalhes — Forca</label>
<SN_ k={cx+"forca_cad"} label="Cadáver na forca?" val={g(cx+"forca_cad")} onChange={s} styles={ST}/>
{g(cx+"forca_cad")==="Sim"&&<div style={{marginTop:8}}><Rd_ k={cx+"forca_susp"} label="Suspensão" opts={["Completa","Incompleta"]} val={g(cx+"forca_susp")} onChange={s} styles={ST}/></div>}
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
<F_ k={cx+"forca_inst"} label="Instrumento" val={g(cx+"forca_inst")} onChange={s} styles={ST}/>
<F_ k={cx+"forca_anc"} label="Local de ancoragem" val={g(cx+"forca_anc")} onChange={s} styles={ST}/>
<F_ k={cx+"forca_alt_anc"} label="Altura ponto ancoragem" val={g(cx+"forca_alt_anc")} onChange={s} styles={ST}/>
<F_ k={cx+"forca_alt_no"} label="Altura do nó" val={g(cx+"forca_alt_no")} onChange={s} styles={ST}/>
<F_ k={cx+"forca_alt_pesc"} label="Altura do pescoço" val={g(cx+"forca_alt_pesc")} onChange={s} styles={ST}/>
</div>
<div style={{marginTop:10}}><Ck_ k={cx+"forca_sulco"} label="Características do sulco" opts={["Acima da cartilagem tireoide","Ascendente","Bordo superior mais saliente","Compatível com a corda encontrada","Escoriações ungueais nas regiões adjacentes","Exibindo impressão da trama do instrumento constritor","Fundo nacarado e enrugado","Interrompido ao nível do nó","Oblíquo"]} val={data[cx+"forca_sulco"]} onChange={s} styles={ST}/></div>
<div style={{marginTop:10}}><Ck_ k={cx+"forca_achados"} label="Demais achados" opts={["Cianose da face","Cianose dos lábios","Cianose dos leitos ungueais","Fezes","Fluido seminal","Hemorragia bucal","Hemorragia nasal","Língua protrusa","Livores de hipóstase nas extremidades dos membros","Petéquias (manchas de Tardieu)","Urina"]} val={data[cx+"forca_achados"]} onChange={s} styles={ST}/></div>
<div style={{marginTop:8}}><F_ k={cx+"forca_obs"} label="Observações — Forca / Enforcamento" type="textarea" val={g(cx+"forca_obs")} onChange={s} styles={ST}/></div>
</div>}

{g(cx+"sui_tipo")==="Arma de fogo"&&<div style={{background:dark?"#1a1a2e":"#f0f0ff",borderRadius:10,padding:12,marginTop:8,border:`1px solid ${dark?"#2a2a4e":"#d0d0ff"}`}}>
<label style={{...lb,fontSize:12,marginBottom:10}}><AppIcon name="🔫" size={16} mr={5}/>Detalhes — Arma de fogo</label>
<SN_ k={cx+"af_local"} label="Arma de fogo no local?" val={g(cx+"af_local")} onChange={s} styles={ST}/>
{g(cx+"af_local")==="Sim"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
<F_ k={cx+"af_modelo"} label="Modelo" val={g(cx+"af_modelo")} onChange={s} styles={ST}/>
<F_ k={cx+"af_serie"} label="Nº Série" val={g(cx+"af_serie")} onChange={s} styles={ST}/>
<F_ k={cx+"af_calibre"} label="Calibre" val={g(cx+"af_calibre")} onChange={s} styles={ST}/>
<SN_ k={cx+"af_sangue"} label="Sangue?" val={g(cx+"af_sangue")} onChange={s} styles={ST}/>
</div>}
<div style={{marginTop:8}}><F_ k={cx+"af_obs"} label="Observações — Arma de Fogo" type="textarea" val={g(cx+"af_obs")} onChange={s} styles={ST}/></div>
</div>}

{g(cx+"sui_tipo")==="Arma branca"&&<div style={{background:dark?"#1a1a2e":"#f0f0ff",borderRadius:10,padding:12,marginTop:8,border:`1px solid ${dark?"#2a2a4e":"#d0d0ff"}`}}>
<label style={{...lb,fontSize:12,marginBottom:10}}><AppIcon name="🔪" size={16} mr={5}/>Detalhes — Arma branca</label>
<SN_ k={cx+"ab_local"} label="Arma branca no local?" val={g(cx+"ab_local")} onChange={s} styles={ST}/>
{g(cx+"ab_local")==="Sim"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
<F_ k={cx+"ab_cabo"} label="Tamanho do cabo" val={g(cx+"ab_cabo")} onChange={s} styles={ST}/>
<F_ k={cx+"ab_lamina"} label="Tamanho da lâmina" val={g(cx+"ab_lamina")} onChange={s} styles={ST}/>
<SN_ k={cx+"ab_sangue"} label="Sangue na lâmina?" val={g(cx+"ab_sangue")} onChange={s} styles={ST}/>
</div>}
<div style={{marginTop:8}}><F_ k={cx+"ab_obs"} label="Observações — Arma Branca" type="textarea" val={g(cx+"ab_obs")} onChange={s} styles={ST}/></div>
</div>}

{g(cx+"sui_tipo")==="Medicamento"&&<div style={{background:dark?"#1a1a2e":"#f0f0ff",borderRadius:10,padding:12,marginTop:8,border:`1px solid ${dark?"#2a2a4e":"#d0d0ff"}`}}>
<label style={{...lb,fontSize:12,marginBottom:10}}><AppIcon name="💊" size={16} mr={5}/>Detalhes — Medicamentos</label>
{(data[cx+"meds"]||[{id:1,nome:"",comprimidos:"",obs:""}]).map((m,mi)=>(<div key={m.id||mi} style={{background:t.bg3,borderRadius:8,padding:10,marginBottom:6,border:`0.5px solid ${t.bd}`}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:13,fontWeight:600,color:t.ac}}>Medicamento {mi+1}</span>{(data[cx+"meds"]||[]).length>1&&<button type="button" style={{background:"rgba(255,59,48,0.12)",border:`1.5px solid ${t.no}`,color:t.no,cursor:"pointer",fontSize:20,fontWeight:700,borderRadius:10,padding:"4px 12px",minWidth:40,minHeight:44,lineHeight:1,fontFamily:"inherit"}} title="Remover medicamento" aria-label="Remover medicamento" onClick={()=>{const arr=[...(data[cx+"meds"]||[])];arr.splice(mi,1);s(cx+"meds",arr);haptic("medium");}}>×</button>}</div>
<div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:6}}>
<div><label style={lb}>Nome</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={inp} defaultValue={m.nome} onBlur={e=>{const arr=[...(data[cx+"meds"]||[{id:1,nome:"",comprimidos:"",obs:""}])];arr[mi]={...arr[mi],nome:e.target.value};s(cx+"meds",arr);}}/></div>
<div><label style={lb}>Espaços vazios</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={inp} defaultValue={m.vazios} onBlur={e=>{const arr=[...(data[cx+"meds"]||[{id:1,nome:"",comprimidos:"",obs:""}])];arr[mi]={...arr[mi],vazios:e.target.value};s(cx+"meds",arr);}}/></div>
<div><label style={lb}>Comprimidos</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={inp} defaultValue={m.comprimidos} onBlur={e=>{const arr=[...(data[cx+"meds"]||[{id:1,nome:"",comprimidos:"",obs:""}])];arr[mi]={...arr[mi],comprimidos:e.target.value};s(cx+"meds",arr);}}/></div>
</div>
<div style={{marginTop:6}}><F_ k={cx+"med_obs_"+mi} label={`Obs — Medicamento ${mi+1}`} type="textarea" val={m.obs||""} onChange={(_k,val)=>{const arr=[...(data[cx+"meds"]||[{id:1,nome:"",comprimidos:"",obs:""}])];arr[mi]={...arr[mi],obs:val};s(cx+"meds",arr);}} styles={ST}/></div>
</div>))}
<button type="button" style={abtn} onClick={()=>{const arr=[...(data[cx+"meds"]||[{id:1,nome:"",comprimidos:"",obs:""}])];arr.push({id:uid(),nome:"",comprimidos:"",obs:""});s(cx+"meds",arr);}}>+ Medicamento</button>
</div>}

{g(cx+"sui_tipo")==="Projeção"&&<div style={{background:dark?"#1a1a2e":"#f0f0ff",borderRadius:10,padding:12,marginTop:8,border:`1px solid ${dark?"#2a2a4e":"#d0d0ff"}`}}>
<label style={{...lb,fontSize:12,marginBottom:10}}><AppIcon name="🏢" size={16} mr={5}/>Detalhes — Projeção</label>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
<F_ k={cx+"proj_alt"} label="Altura do ponto ao piso" val={g(cx+"proj_alt")} onChange={s} styles={ST}/>
<F_ k={cx+"proj_local"} label="Local provável da projeção" val={g(cx+"proj_local")} onChange={s} styles={ST}/>
<F_ k={cx+"proj_alt_parapeito"} label="Altura do parapeito ao piso" val={g(cx+"proj_alt_parapeito")} onChange={s} styles={ST}/>
<F_ k={cx+"proj_alt_apoio"} label="Altura de obj. usado como apoio" val={g(cx+"proj_alt_apoio")} onChange={s} styles={ST}/>
</div>
<div style={{marginTop:8}}><F_ k={cx+"proj_obs"} label="Observações — Projeção / Queda" type="textarea" val={g(cx+"proj_obs")} onChange={s} styles={ST}/></div>
</div>}

{g(cx+"sui_tipo")==="Outro"&&<div style={{marginTop:8}}><F_ k={cx+"sui_outro_obs"} label="Observações — Suicídio (outros métodos)" type="textarea" val={g(cx+"sui_outro_obs")} onChange={s} styles={ST}/></div>}
</>}

</div></Cd_>
<Cd_ styles={ST} title="Lesões — Toque na região" aria-label="Lesões — Toque na região" icon="🩹" variant="danger"><div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>{[["front","🧍 Frente"],["back","🔄 Costas"],["lateral","↔ Laterais"],["head","🗣️ Cabeça"],["hand_d","🤚 Mão D"],["hand_e","✋ Mão E"],["foot_d","🦶 Pé D"],["foot_e","🦶 Pé E"]].map(([v,l])=><button type="button" key={v} style={tb(bodyView===v)} onClick={()=>setBodyView(v)}><IconText text={l} size={14} gap={4}/></button>)}</div><div style={{display:"flex",justifyContent:"center",background:dark?"#1a1a1a":"#fafafa",borderRadius:10,padding:12,border:`0.5px solid ${t.bd}`}}>{bodyView==="front"&&<BF/>}{bodyView==="back"&&<BB/>}{bodyView==="lateral"&&<BLat/>}{bodyView==="head"&&<HS/>}{bodyView==="hand_d"&&<MSvg side="D"/>}{bodyView==="hand_e"&&<MSvg side="E"/>}
{bodyView==="foot_d"&&<FootSvg side="D"/>}
{bodyView==="foot_e"&&<FootSvg side="E"/>}</div>{wounds.filter(w=>w.cadaver===cadaverIdx).length>0&&<div style={{marginTop:16}}><label style={{...lb,fontSize:12}}>Feridas ({wounds.filter(w=>w.cadaver===cadaverIdx).length})</label>{wounds.map((w,i)=>{if(w.cadaver!==cadaverIdx)return null;return(<div key={w.id} style={{background:t.bg3,borderRadius:10,padding:10,marginBottom:6,border:`0.5px solid ${t.bd}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:12,fontWeight:700,color:t.no}}><AppIcon name="📍" size={12} mr={3}/>{w.regionLabel}</span><FotoBtn rk={"wound_"+w.id}/><button type="button" style={{background:"rgba(255,59,48,0.12)",border:`1.5px solid ${t.no}`,color:t.no,cursor:"pointer",fontSize:20,fontWeight:700,borderRadius:10,padding:"4px 12px",minWidth:40,minHeight:44,lineHeight:1,fontFamily:"inherit"}} title="Remover lesão" aria-label="Remover lesão" onClick={()=>{const hasData=!!(w.tipo||w.obs||(w.caract&&w.caract.length));const doDel=()=>setWounds(wounds.filter((_,j)=>j!==i));if(hasData){reqDel(`Remover lesão em ${w.regionLabel}?`,w.tipo?`Tipo: ${w.tipo}`:"(região selecionada sem tipo)",doDel);}else{doDel();haptic("medium");}}}>×</button></div><select style={{...sel,fontSize:13,marginBottom:6}} value={w.tipo} onChange={e=>{setWounds(prev=>prev.map((w2,j)=>j===i?{...w2,tipo:e.target.value}:w2));}}><option value=""></option>{WT.map(wt=><option key={wt}>{wt}</option>)}</select>{(w.tipo==="1. Orifício entrada (PAF)"||w.tipo==="2. Orifício saída (PAF)")&&<div style={{marginBottom:8}}><label style={lb}>Características</label><div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:4}}>{["Câmara de mina de Hoffman","Elementos secundários de DAF","Formato circular","Formato estrelado","Formato ovalar","Orla de enxugo","Orla de escoriação","Orla equimótica","Sinal de Wekgaertner"].map(o=>{const sel2=(w.caract||[]).includes(o);return <button type="button" key={o} style={ch(sel2)} onClick={()=>{setWounds(prev=>prev.map((w2,j)=>{if(j!==i)return w2;const arr2=w2.caract||[];const has=arr2.indexOf(o);return{...w2,caract:has>-1?arr2.filter(x=>x!==o):[...arr2,o]};}));}}>{o}</button>;})}
</div></div>}{w.tipo==="8. Incisa"&&<div style={{marginBottom:8}}><label style={lb}>Características</label><div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:4}}>{["Bordas regulares e extremidades afiladas","Bordas regulares, com uma extremidade afilada e outra abaulada"].map(o=>{const sel2=(w.caract||[]).includes(o);return <button type="button" key={o} style={ch(sel2)} onClick={()=>{setWounds(prev=>prev.map((w2,j)=>{if(j!==i)return w2;const arr2=w2.caract||[];const has=arr2.indexOf(o);return{...w2,caract:has>-1?arr2.filter(x=>x!==o):[...arr2,o]};}));}}>{o}</button>;})}
</div></div>}{w.tipo==="7. Contusa"&&<div style={{marginBottom:8}}><label style={lb}>Características</label><div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:4}}>{["Bordas irregulares","Fraturas no plano ósseo subjacente","Pontes de tecido"].map(o=>{const sel2=(w.caract||[]).includes(o);return <button type="button" key={o} style={ch(sel2)} onClick={()=>{setWounds(prev=>prev.map((w2,j)=>{if(j!==i)return w2;const arr2=w2.caract||[];const has=arr2.indexOf(o);return{...w2,caract:has>-1?arr2.filter(x=>x!==o):[...arr2,o]};}));}}>{o}</button>;})}
</div></div>}<F_ k={"wobs_"+w.id} label="" type="textarea" val={w.obs||""} onChange={(_k,val)=>{setWounds(prev=>prev.map((w2,j)=>j===i?{...w2,obs:val}:w2));}} styles={ST}/></div>);})}
</div>}</Cd_>
<Cd_ styles={ST} title="Fenômenos Cadavéricos" aria-label="Fenômenos Cadavéricos" icon="🔬" variant="teal"><div style={{display:"flex",flexDirection:"column",gap:12}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Rd_ k={cx+"cu"} label="Cianose Ungueais?" opts={["Sim","Não","Prejudicado"]} val={g(cx+"cu")} onChange={s} styles={ST}/><Rd_ k={cx+"cl"} label="Cianose Labial?" opts={["Sim","Não","Prejudicado"]} val={g(cx+"cl")} onChange={s} styles={ST}/></div><Rd_ k={cx+"rm"} label="Rigidez Mandíbula" opts={["Não perceptível","Em instalação","Instalada","Em desinstalação","Desinstalada","Prejudicada"]} val={g(cx+"rm")} onChange={s} styles={ST}/><Rd_ k={cx+"rs"} label="Rigidez Sup." opts={["Não perceptível","Em instalação","Instalada","Em desinstalação","Desinstalada","Prejudicada"]} val={g(cx+"rs")} onChange={s} styles={ST}/><Rd_ k={cx+"ri"} label="Rigidez Inf." opts={["Não perceptível","Em instalação","Instalada","Em desinstalação","Desinstalada","Prejudicada"]} val={g(cx+"ri")} onChange={s} styles={ST}/><Rd_ k={cx+"lv"} label="Livores" opts={["Não perceptível","Móvel","Quase-fixo","Fixo","Prejudicado"]} val={g(cx+"lv")} onChange={s} styles={ST}/><F_ k={cx+"lp"} label="Posição dos Livores" val={g(cx+"lp")} onChange={s} styles={ST}/><Rd_ k={cx+"lc"} label="Compatível?" opts={["Sim","Não","Prejudicado"]} val={g(cx+"lc")} onChange={s} styles={ST}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Rd_ k={cx+"sn"} label="Secr. Nasal?" opts={["Sim","Não","Prejudicado"]} val={g(cx+"sn")} onChange={s} styles={ST}/><Rd_ k={cx+"so"} label="Secr. Oral?" opts={["Sim","Não","Prejudicado"]} val={g(cx+"so")} onChange={s} styles={ST}/><Rd_ k={cx+"sg"} label="Peniana/Vaginal?" opts={["Sim","Não","Prejudicado"]} val={g(cx+"sg")} onChange={s} styles={ST}/><Rd_ k={cx+"sa"} label="Anal?" opts={["Sim","Não","Prejudicado"]} val={g(cx+"sa")} onChange={s} styles={ST}/></div><Rd_ k={cx+"mva"} label="Mancha verde abdominal" opts={["Ausente","Presente","Prejudicada"]} val={g(cx+"mva")} onChange={s} styles={ST}/><div style={{marginTop:12}}><F_ k={cx+"obs_peri"} label="Obs. fenômenos cadavéricos" type="textarea" val={g(cx+"obs_peri")} onChange={s} styles={ST}/></div></div></Cd_>
{g(cx+"avancado_decomp")&&(()=>{const tg=(k2,o)=>{const cur=g(cx+k2)||[];const idx=cur.indexOf(o);const nx=idx>-1?cur.filter(x=>x!==o):[...cur,o];s(cx+k2,nx);};const grupos=[["dec_abio","Fenômenos abióticos / transformação",["Mancha verde abdominal","Rede venosa pútrida","Enfisema putrefativo (face)","Enfisema putrefativo (abdome)","Enfisema putrefativo (escroto/vulva)","Bolhas/flictenas pútridas","Desprendimento epidérmico","Luva da morte (mãos)","Saída de líquidos pútridos pela boca","Saída de líquidos pútridos pelo nariz","Saída de líquidos pútridos pelo ânus","Saída de líquidos pútridos pela vagina","Distensão abdominal com timpanismo","Liquefação tecidual / coliquação","Coloração enegrecida generalizada","Olhos liquefeitos / colapsados","Cabelo se desprendendo","Unhas se desprendendo","Língua protrusa","Olhos protrusos","Odor pútrido característico"]],["dec_fauna","Fauna cadavérica (entomologia)",["Larvas de díptero (varejeira)","Pupas","Coleópteros (escaravelhos)","Miíase","Múltiplas gerações de larvas","Sem fauna visível"]],["dec_cons","Conservação alternativa",["Saponificação / adipocera","Mumificação parcial","Mumificação total","Esqueletização parcial","Esqueletização total"]],["dec_amb","Achados ambientais / interferências",["Predação por roedores","Predação por cães/canídeos","Predação por aves","Manchas pútridas no substrato (poça subjacente)","Posição/decúbito alterados pela fauna","Maceração generalizada (ambiente úmido)","Ressecamento (ambiente seco)"]]];return(<Cd_ styles={ST} title="Decomposição Avançada — Achados" aria-label="Decomposição Avançada — Achados" icon="☠️" variant="danger"><div style={{padding:"8px 12px",background:dark?"#2a1410":"#fff8f5",border:`1px solid ${dark?"#552020":"#ffd5c4"}`,borderRadius:8,marginBottom:12,fontSize:11,color:t.t2,lineHeight:1.5}}>Marque os achados observados. <b>Lembre:</b> em putrefação avançada não estimar idade, etnia ou compleição — manter "Prejudicado". Sexo só se genitália preservada. Diagnóstico de causa de morte: registrar achados externos sugestivos e remeter ao IML.</div>{grupos.map(([gk,gl,gopts])=>{const cur=g(cx+gk)||[];return(<div key={gk} style={{marginBottom:14}}><label style={{...lb,fontSize:11,fontWeight:700,color:t.no,marginBottom:6}}>{gl} {cur.length>0&&<span style={{fontWeight:400,color:t.t3}}>({cur.length})</span>}</label><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{gopts.map(o=>{const sel2=cur.includes(o);return <button type="button" key={o} style={{...ch(sel2),fontSize:11,padding:"5px 10px"}} onClick={()=>tg(gk,o)}>{o}</button>;})}
</div></div>);})}
<F_ k={cx+"dec_obs"} label="Observações específicas (datação aproximada, fauna detalhada, posição relativa, etc.)" type="textarea" val={g(cx+"dec_obs")} onChange={s} styles={ST}/><div style={{marginTop:12,padding:"10px 12px",background:t.infoBgS,border:`1px solid ${t.bd}`,borderRadius:8,fontSize:12,color:t.t2,lineHeight:1.5}}>💡 <b>Sugestão para o laudo:</b> "Cadáver em avançado estágio de decomposição, não recente, prejudicada a estimativa de faixa etária, etnia e compleição. Demais achados detalhados acima, recomendando-se exame interno no IML para determinação de causa jurídica."</div></Cd_>);})()}
<Cd_ styles={ST} title="Vestes e Pertences" aria-label="Vestes e Pertences" icon="👔" variant="info"><div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}><span style={{fontSize:11,fontWeight:500,color:t.t2}}>Vestes</span><FotoBtn rk={"cad_vestes_"+cadaverIdx}/></div>{vestes.filter(v=>v.cadaver===undefined||v.cadaver===cadaverIdx).length===0&&vestes.length>0?<p style={{fontSize:12,color:t.t2}}>Nenhuma veste para este cadáver</p>:null}{(()=>{let vn=0;return vestes.map((v,i)=>{if(v.cadaver!==undefined&&v.cadaver!==cadaverIdx)return null;vn++;return(<div key={v.id} style={{background:t.bg3,borderRadius:10,padding:12,marginBottom:8,border:`0.5px solid ${t.bd}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:13,fontWeight:600,color:t.ac}}>Veste {vn}</span><div style={{display:"flex",alignItems:"center",gap:4}}><FotoBtn rk={"veste_"+v.id}/><button type="button" style={{background:"transparent",border:`1.5px solid ${t.ac}`,color:t.ac,cursor:"pointer",borderRadius:10,padding:"4px 12px",minWidth:40,minHeight:44,display:"inline-flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}} title="Duplicar veste" aria-label="Duplicar veste" onClick={()=>{setVestes([...vestes,{...v,id:uid(),cadaver:cadaverIdx}]);haptic("light");}}><Copy size={16} strokeWidth={2.2}/></button><button type="button" style={{background:"rgba(255,59,48,0.12)",border:`1.5px solid ${t.no}`,color:t.no,cursor:"pointer",fontSize:20,fontWeight:700,borderRadius:10,padding:"4px 12px",minWidth:40,minHeight:44,lineHeight:1,fontFamily:"inherit"}} title="Remover veste" aria-label="Remover veste" onClick={()=>{setVestes(vestes.filter((_,j)=>j!==i));haptic("medium");}}>×</button></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><div><label style={lb}>Tipo/Marca</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={inp} defaultValue={v.tipo} onBlur={e=>{setVestes(prev=>prev.map((v2,j)=>j===i?{...v2,tipo:e.target.value,cadaver:cadaverIdx}:v2));}}/></div><div><label style={lb}>Cor</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={inp} defaultValue={v.cor} onBlur={e=>{setVestes(prev=>prev.map((v2,j)=>j===i?{...v2,cor:e.target.value,cadaver:cadaverIdx}:v2));}}/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:8}}>{[["sujidades","Suj?"],["sangue","Sg?"],["bolsos","Bols?"]].map(([f,l])=>(<div key={f}><label style={lb}>{l}</label><div style={{display:"flex"}}><button type="button" style={tY(v[f]==="Sim")} onClick={()=>{setVestes(prev=>prev.map((v2,j)=>j===i?{...v2,[f]:"Sim",cadaver:cadaverIdx}:v2));}}>S</button><button type="button" style={tN(v[f]==="Não")} onClick={()=>{setVestes(prev=>prev.map((v2,j)=>j===i?{...v2,[f]:"Não",cadaver:cadaverIdx}:v2));}}>N</button></div></div>))}</div><div style={{marginTop:8}}><label style={lb}>Notas</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={inp} defaultValue={v.notas} onBlur={e=>{setVestes(prev=>prev.map((v2,j)=>j===i?{...v2,notas:e.target.value,cadaver:cadaverIdx}:v2));}}/></div></div>);})})()}
<button type="button" style={abtn} onClick={()=>setVestes([...vestes,{id:uid(),cadaver:cadaverIdx,tipo:"",cor:"",sujidades:"",sangue:"",bolsos:"",notas:""}])}>+ Veste</button>
<div style={{marginTop:12}}><F_ k={cx+"pert"} label="Pertences" type="textarea" val={g(cx+"pert")} onChange={s} styles={ST}/></div>
</Cd_>
{/* v234: Observações gerais por cadáver (livre, separado do obs_peri de fenômenos) */}
<Cd_ styles={ST} title="Observações Gerais do Cadáver" aria-label="Observações Gerais" icon="📝" variant="info"><F_ k={cx+"obs_geral"} label="Anotações livres sobre este cadáver (qualquer observação relevante para a perícia que não se encaixe nos outros campos)" type="textarea" val={g(cx+"obs_geral")} onChange={s} styles={ST}/></Cd_>
</div>{navBtns()}</>);

  // ╔════════════════════════════════════════╗
  // ║  ABA 4 — VEÍCULO                       ║
  // ╚════════════════════════════════════════╝
if(tab===TAB_VEICULO){const vx=`v${veiIdx}_`;return(<><Cd_ styles={ST} title="Veículos" aria-label="Veículos" icon="🚗" variant="slate"><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}><div style={segContainer}>{veiculos.map((c,i)=><button type="button" key={c.id} style={segTab(veiIdx===i)} onClick={()=>setVeiIdx(i)}>{c.label}</button>)}</div><div style={{display:"flex",gap:4,alignItems:"center"}}><FotoBtn rk={"vei_"+veiculos[veiIdx]?.id}/>{veiculos.length>1&&<button type="button" style={{background:"rgba(255,59,48,0.12)",border:`1.5px solid ${t.no}`,color:t.no,cursor:"pointer",fontSize:16,fontWeight:700,borderRadius:8,padding:"6px 10px",minWidth:44,minHeight:44,lineHeight:1,fontFamily:"inherit"}} title="Remover veículo atual" aria-label="Remover veículo atual" onClick={()=>{const i=veiIdx;setVeiculos(veiculos.filter((_,j)=>j!==i));setVeiIdx(Math.max(0,Math.min(veiIdx,veiculos.length-2)));}}>×</button>}<button type="button" style={{...abtn,width:"auto",padding:"8px 14px",fontSize:13}} onClick={()=>{setVeiculos([...veiculos,{id:uid(),label:`Veículo ${veiculos.length+1}`}]);setVeiIdx(veiculos.length);}}>+ Veículo</button></div></div>{veiculos.length>1&&<p style={{fontSize:12,color:t.t2,marginTop:6}}>Editando: <b>{veiculos[veiIdx]?.label}</b></p>}</Cd_>
<div key={veiIdx}><Cd_ styles={ST} title="Dados do Veículo" aria-label="Dados do Veículo" icon="📋" variant="primary"><div style={{marginBottom:12}}><label style={lb}>Categoria</label><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["Carro","Moto","Bicicleta","Caminhão","Ônibus"].map(cat=>{const isOn=g(vx+"cat")===cat;return <button type="button" key={cat} style={ch(isOn)} onClick={()=>s(vx+"cat",isOn?"":cat)} aria-pressed={isOn}>{cat}</button>;})}
</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><F_ k={vx+"tipo"} label="Tipo/Modelo" val={g(vx+"tipo")} onChange={s} styles={ST}/><F_ k={vx+"cor"} label="Cor" val={g(vx+"cor")} onChange={s} styles={ST}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginTop:12}}><F_ k={vx+"placa"} label="Placa" val={g(vx+"placa")} onChange={s} styles={ST}/><F_ k={vx+"ano"} label="Ano" val={g(vx+"ano")} onChange={s} styles={ST}/><F_ k={vx+"chassi"} label="Chassi" val={g(vx+"chassi")} onChange={s} styles={ST}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}><F_ k={vx+"km"} label="Hodômetro (km)" val={g(vx+"km")} onChange={s} styles={ST}/><Rd_ k={vx+"estado"} label="Estado" opts={["Íntegro","Avariado","Incendiado","Prejudicado"]} val={g(vx+"estado")} onChange={s} styles={ST}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}><SN_ k={vx+"motor"} label="Motor Liga?" val={g(vx+"motor")} onChange={s} styles={ST}/><SN_ k={vx+"portas"} label="Portas travadas?" val={g(vx+"portas")} onChange={s} styles={ST}/><SN_ k={vx+"vidros"} label="Vidros íntegros?" val={g(vx+"vidros")} onChange={s} styles={ST}/><SN_ k={vx+"chave"} label="Chave presente?" val={g(vx+"chave")} onChange={s} styles={ST}/></div></Cd_>
<Cd_ styles={ST} title="Vestígios no Veículo — Toque na região" aria-label="Vestígios no Veículo — Toque na região" icon="🔍" variant="danger"><div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>{(()=>{const cat=g(vx+"cat")||"Carro";const views={Carro:[["ext_lat_e","Lateral E"],["ext_lat_d","Lateral D"],["ext_frente","Frente"],["ext_tras","Traseira"],["ext_teto","Teto"],["interior","Interior"]],Moto:[["moto_lat_e","Lateral E"],["moto_lat_d","Lateral D"],["moto_frente","Frente"],["moto_tras","Traseira"]],Bicicleta:[["bici_lat_e","Lateral E"],["bici_lat_d","Lateral D"]],Caminhão:[["cam_lat_e","Lateral E"],["cam_lat_d","Lateral D"],["cam_frente","Frente"],["cam_tras","Traseira"],["cam_int","Cabine"]],Ônibus:[["bus_lat_e","Lateral E"],["bus_lat_d","Lateral D"],["bus_frente","Frente"],["bus_tras","Traseira"],["bus_int","Interior"]]};return(views[cat]||views.Carro).map(([v,l])=><button type="button" key={v} style={tb(veiView===v)} onClick={()=>setVeiView(v)}>{l}</button>);})()}</div><div style={{display:"flex",justifyContent:"center",background:dark?"#1a1a1a":"#fafafa",borderRadius:10,padding:12,border:`0.5px solid ${t.bd}`}}>{veiView==="ext_lat_e"&&<VLatSvg side="E"/>}{veiView==="ext_lat_d"&&<VLatSvg side="D"/>}{veiView==="ext_frente"&&<VFrenteSvg/>}{veiView==="ext_tras"&&<VTrasSvg/>}{veiView==="ext_teto"&&<VTetoSvg/>}{veiView==="interior"&&<VIntSvg/>}
{veiView==="moto_lat_e"&&<MotoLatSvg side="E"/>}{veiView==="moto_lat_d"&&<MotoLatSvg side="D"/>}{veiView==="moto_frente"&&<MotoFrenteSvg/>}{veiView==="moto_tras"&&<MotoTrasSvg/>}
{veiView==="bici_lat_e"&&<BiciLatSvg side="E"/>}{veiView==="bici_lat_d"&&<BiciLatSvg side="D"/>}
{veiView==="cam_lat_e"&&<CamLatSvg side="E"/>}{veiView==="cam_lat_d"&&<CamLatSvg side="D"/>}{veiView==="cam_frente"&&<CamFrenteSvg/>}{veiView==="cam_tras"&&<CamTrasSvg/>}{veiView==="cam_int"&&<CamIntSvg/>}
{veiView==="bus_lat_e"&&<BusLatSvg side="E"/>}{veiView==="bus_lat_d"&&<BusLatSvg side="D"/>}{veiView==="bus_frente"&&<BusFrenteSvg/>}{veiView==="bus_tras"&&<BusTrasSvg/>}{veiView==="bus_int"&&<BusIntSvg/>}</div>{veiVest.filter(v=>v.veiculo===undefined||v.veiculo===veiIdx).length>0&&<div style={{marginTop:16}}><label style={{...lb,fontSize:12}}>Vestígios no veículo ({veiVest.filter(v=>v.veiculo===undefined||v.veiculo===veiIdx).length})</label>{veiVest.filter(v=>v.veiculo===undefined||v.veiculo===veiIdx).map((v,i)=>{const upVV=(field,val)=>setVeiVest(prev=>prev.map(v2=>v2.id===v.id?{...v2,[field]:val}:v2));const destParts=(v.destino||"").split("+").filter(Boolean);return(<div key={v.id} style={{background:t.bg3,borderRadius:10,padding:12,marginBottom:8,border:`0.5px solid ${t.bd}`,borderLeft:`4px solid ${destParts.includes("IC")?"#007aff":destParts.includes("II")?"#ff9500":t.bd}`}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:13,fontWeight:700,color:t.no}}>📍 {v.regionLabel}</span><div style={{display:"flex",gap:4,alignItems:"center"}}><FotoBtn rk={"veivest_"+v.id}/><button type="button" style={{background:"rgba(255,59,48,0.12)",border:`1.5px solid ${t.no}`,color:t.no,cursor:"pointer",fontSize:20,fontWeight:700,borderRadius:10,padding:"4px 12px",minWidth:40,minHeight:44,lineHeight:1,fontFamily:"inherit"}} title="Remover vestígio veicular" aria-label="Remover vestígio veicular" onClick={()=>{const hasData=!!(v.tipo||v.obs||v.destino);const doDel=()=>setVeiVest(prev=>prev.filter(x=>x.id!==v.id));if(hasData){reqDel(`Remover vestígio em ${v.regionLabel}?`,v.tipo?`Tipo: ${v.tipo}`:"(região com dados adicionais)",doDel);}else{doDel();haptic("medium");}}}>×</button></div></div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
<div><label style={{...lb,fontSize:12}}>Localização (editável)</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={{...inp,fontSize:12}} defaultValue={v.regionLabel} onBlur={e=>upVV("regionLabel",e.target.value)}/></div>
<div><label style={{...lb,fontSize:12}}>Vestígio encontrado</label><select style={{...sel,fontSize:12,marginBottom:4}} value={VVT.includes(v.tipo)?v.tipo:""} onChange={e=>upVV("tipo",e.target.value)}><option value="">— Selecione ou edite abaixo —</option>{VVT.map(vt=><option key={vt}>{vt}</option>)}</select><TX_ inputKey={v.id+"-t-"+v.tipo} value={v.tipo||""} placeholder="Editar / complementar vestígio" inputStyle={{...inp,fontSize:12}} onCommit={(val)=>upVV("tipo",val)}/></div>
</div>
<div style={{marginBottom:8}}><label style={{...lb,fontSize:12}}>Observações</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={{...inp,fontSize:12}} defaultValue={v.obs||""} onBlur={e=>upVV("obs",e.target.value)}/></div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
<div><label style={{...lb,fontSize:12}}>Recolhido?</label><div style={{display:"flex"}}><button type="button" style={tY(v.recolhido==="Sim")} onClick={()=>upVV("recolhido","Sim")}>S</button><button type="button" style={tN(v.recolhido==="Não")} onClick={()=>upVV("recolhido","Não")}>N</button></div></div>
<div><label style={{...lb,fontSize:12}}>Destino</label><div style={{display:"flex",gap:4}}>{["IC","II"].map(dd=>{const isOn=destParts.includes(dd);return <button type="button" key={dd} style={{padding:"7px 14px",fontSize:13,borderRadius:8,border:`1.5px solid ${isOn?"#007aff":t.bd}`,background:isOn?"rgba(0,122,255,0.12)":"transparent",color:isOn?"#007aff":t.t3,cursor:"pointer",fontFamily:"inherit",fontWeight:isOn?600:400}} onClick={()=>{const idx2=destParts.indexOf(dd);upVV("destino",idx2>-1?destParts.filter(x=>x!==dd).join("+"):[...destParts,dd].join("+"));}}>{dd}</button>;})}
</div></div>
</div>
</div>)})}
</div>}</Cd_>
<Cd_ styles={ST} title="Observações" aria-label="Observações" icon="📝"><F_ k={vx+"obs"} label={`Observações — Veículo ${veiIdx+1}`} type="textarea" val={g(vx+"obs")} onChange={s} styles={ST}/></Cd_>
</div>{navBtns()}</>);}
  // ╔════════════════════════════════════════╗
  // ║  ABA 5 — DESENHO (Canvas)              ║
  // ╚════════════════════════════════════════╝
if(tab===TAB_DESENHO){const switchCanvas=(ni)=>{if(ni===desenhoIdx)return;sv();setDesenhoIdx(ni);};const delCanvas=(di)=>{if(desenhos.length<2)return;const n=desenhos.filter((_,j)=>j!==di);const newImgs={};let ni2=0;for(let j=0;j<desenhos.length;j++){if(j===di)continue;if(imgRef.current[j])newImgs[ni2]=imgRef.current[j];ni2++;}imgRef.current=newImgs;setDesenhos(n);setDesenhoIdx(Math.max(0,Math.min(desenhoIdx,n.length-1)));};return(<><Cd_ styles={ST} title="Croquis" aria-label="Croquis" icon="🖼️" variant="primary"><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}><div style={segContainer}>{desenhos.map((d2,di)=><button type="button" key={d2.id} style={segTab(desenhoIdx===di)} onClick={()=>switchCanvas(di)}>{d2.label}</button>)}</div><div style={{display:"flex",gap:4,alignItems:"center"}}>{desenhos.length>1&&<button type="button" style={{background:"rgba(255,59,48,0.12)",border:`1.5px solid ${t.no}`,color:t.no,cursor:"pointer",fontSize:16,fontWeight:700,borderRadius:8,padding:"6px 10px",minWidth:44,minHeight:44,lineHeight:1,fontFamily:"inherit"}} title="Remover croqui atual" aria-label="Remover croqui atual" onClick={()=>delCanvas(desenhoIdx)}>×</button>}<button type="button" style={{...abtn,width:"auto",padding:"8px 14px",fontSize:13}} onClick={()=>{sv();setDesenhos([...desenhos,{id:uid(),label:`Croqui ${desenhos.length+1}`}]);setDesenhoIdx(desenhos.length);}}>+ Croqui</button></div></div>{desenhos.length>1&&<div style={{display:"flex",gap:6,alignItems:"center",marginTop:8}}><span style={{fontSize:12,color:t.t2}}>Renomear:</span><input autoComplete="off" autoCorrect="off" spellCheck={false} style={{...inp,fontSize:13,padding:"6px 10px",width:200}} defaultValue={desenhos[desenhoIdx]?.label||""} onBlur={e=>{setDesenhos(prev=>prev.map((d3,j)=>j===desenhoIdx?{...d3,label:e.target.value||`Croqui ${desenhoIdx+1}`}:d3));}}/></div>}</Cd_>
<Cd_ styles={ST} title="Modelo Base" aria-label="Modelo Base" icon="🗺️" variant="teal">
<p style={{fontSize:12,color:t.t2,marginBottom:10}}>Aplica ao croqui: <b>{desenhos[desenhoIdx]?.label}</b></p>
<details><summary style={{fontSize:12,fontWeight:600,color:t.ac,cursor:"pointer"}}><AppIcon name="🛣️" size={14} mr={4}/>Via Pública</summary><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6,padding:8,background:t.bg3,borderRadius:8}}>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("blank")}><AppIcon name="📄" size={14} mr={4}/>Em branco</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("pista_simples")}><AppIcon name="🛤️" size={14} mr={4}/>Pista simples</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("pista_dupla")}><AppIcon name="🛣️" size={14} mr={4}/>Pista dupla</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("avenida_canteiro")}><AppIcon name="🌳" size={14} mr={4}/>Av. c/ canteiro</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("pista_simples_transv")}><AppIcon name="↔" size={14} mr={4}/>Pista c/ transv.</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("cruzamento")}><AppIcon name="✚" size={14} mr={4}/>Cruzamento</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("rotatoria")}><AppIcon name="⭕" size={14} mr={4}/>Rotatória</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("curva")}><AppIcon name="↪" size={14} mr={4}/>Curva</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("estacionamento")}><AppIcon name="🅿️" size={14} mr={4}/>Estacionamento</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("estrada_rural")}><AppIcon name="🌾" size={14} mr={4}/>Estrada rural</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("ponte")}><AppIcon name="🌉" size={14} mr={4}/>Ponte</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("viaduto")}><AppIcon name="🌃" size={14} mr={4}/>Viaduto</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("ciclovia")}><AppIcon name="🚲" size={14} mr={4}/>Ciclovia</button>
</div></details>
<details><summary style={{fontSize:12,fontWeight:600,color:t.ac,cursor:"pointer",marginTop:6}}><AppIcon name="🏠" size={14} mr={4}/>Cômodos</summary><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6,padding:8,background:t.bg3,borderRadius:8}}>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("quarto")}><AppIcon name="🛏️" size={14} mr={4}/>Quarto</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("sala")}><AppIcon name="🛋️" size={14} mr={4}/>Sala</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("cozinha")}><AppIcon name="🍳" size={14} mr={4}/>Cozinha</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("banheiro")}><AppIcon name="🚿" size={14} mr={4}/>Banheiro</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("area_servico")}><AppIcon name="🧺" size={14} mr={4}/>Á. serviço</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("garagem")}><AppIcon name="🚗" size={14} mr={4}/>Garagem</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("corredor")}><AppIcon name="🚪" size={14} mr={4}/>Corredor</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("escritorio")}><AppIcon name="📋" size={14} mr={4}/>Escritório</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("varanda")}><AppIcon name="🏡" size={14} mr={4}/>Varanda</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("quintal")}><AppIcon name="🌳" size={14} mr={4}/>Quintal</button>
</div></details>
<details><summary style={{fontSize:12,fontWeight:600,color:t.ac,cursor:"pointer",marginTop:6}}><AppIcon name="🏗️" size={14} mr={4}/>Plantas</summary><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6,padding:8,background:t.bg3,borderRadius:8}}>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("casa_simples")}><AppIcon name="🏠" size={14} mr={4}/>Casa simples</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("apartamento")}><AppIcon name="🏢" size={14} mr={4}/>Apartamento</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("barraco")}><AppIcon name="🏚️" size={14} mr={4}/>Barraco</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("lote_vazio")}><AppIcon name="🟫" size={14} mr={4}/>Lote vazio</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("sobrado")}><AppIcon name="🏘️" size={14} mr={4}/>Sobrado</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("kitnet")}><AppIcon name="🏨" size={14} mr={4}/>Kitnet</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("chacara")}><AppIcon name="🌾" size={14} mr={4}/>Chácara</button>
</div></details>
<details><summary style={{fontSize:12,fontWeight:600,color:t.ac,cursor:"pointer",marginTop:6}}><AppIcon name="🏢" size={14} mr={4}/>Institucional / Outros</summary><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6,padding:8,background:t.bg3,borderRadius:8}}>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("cela")}><AppIcon name="🔒" size={14} mr={4}/>Cela</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("bar_comercio")}><AppIcon name="🏪" size={14} mr={4}/>Bar/Comércio</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("area_externa")}><AppIcon name="🌳" size={14} mr={4}/>Área externa</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("veiculo_sup")}><AppIcon name="🚗" size={14} mr={4}/>Veículo (superior)</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("igreja")}><AppIcon name="⛪" size={14} mr={4}/>Igreja</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("posto_saude")}><AppIcon name="🏥" size={14} mr={4}/>Posto saúde</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("escola")}><AppIcon name="🏫" size={14} mr={4}/>Escola</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("galpao")}><AppIcon name="🏭" size={14} mr={4}/>Galpão</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("edificio")}><AppIcon name="🏬" size={14} mr={4}/>Edifício</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("grade")}><AppIcon name="⬜" size={14} mr={4}/>Quadriculado</button>
<button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("legenda")}><AppIcon name="📋" size={14} mr={4}/>Com legenda</button>
</div></details>
<div style={{marginTop:8,padding:"0 8px"}}><button type="button" style={{...tb(false),fontSize:11}} onClick={()=>drawTemplate("blank")}><AppIcon name="📄" size={14} mr={4}/>Em branco</button></div>
</Cd_>
<Cd_ styles={ST} title="Desenho" aria-label="Desenho" icon="✏️" variant="info"><div style={{paddingBottom:8,borderBottom:`1px solid ${t.bd}`,marginBottom:8}}><div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>{[["pen","✏️ Caneta"],["line","📏 Linha"],["rect","⬜ Retâng."],["circle","⭕ Círculo"],["text","🔤 Texto"],["eraser","🧽 Borracha"]].map(([v,l])=><button type="button" key={v} style={tb(tool===v&&!stmp)} onClick={()=>{setTool(v);setStmp(null);}}><IconText text={l} size={14} gap={4}/></button>)}</div>{tool==="pen"&&!stmp&&<div style={{display:"flex",gap:4,marginBottom:8}}>{[["solid","── Sólido"],["dashed","- - Tracejado"],["dotted","··· Pontilhado"]].map(([v,l])=><button type="button" key={v} style={tb(pStyle===v)} onClick={()=>setPStyle(v)}>{l}</button>)}</div>}{tool==="line"&&!stmp&&<div style={{display:"flex",gap:4,marginBottom:8}}>{[["free","Livre"],["h","— Horiz."],["v","| Vert."]].map(([v,l])=><button type="button" key={v} style={tb(lMode===v)} onClick={()=>setLMode(v)}>{l}</button>)}</div>}{tool==="eraser"&&<div style={{display:"flex",gap:6,marginBottom:8}}><button type="button" style={{...tb(false),color:t.no,borderColor:t.no}} onClick={clr}><AppIcon name="🗑️" size={14} mr={4}/>Apagar Tudo</button></div>}<div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}><input autoComplete="off" autoCorrect="off" spellCheck={false} type="color" value={color} onChange={e=>setColor(e.target.value)} style={{width:32,height:32,border:`1px solid ${t.bd}`,borderRadius:6,cursor:"pointer",padding:2}}/><span style={{fontSize:11,color:t.t2}}>Esp:</span><input autoComplete="off" autoCorrect="off" spellCheck={false} type="range" min="1" max="20" value={sz} onChange={e=>setSz(+e.target.value)} style={{width:80}}/><button type="button" style={tb(false)} onClick={undo}><span style={{marginRight:4,fontWeight:700}}>↩</span>Desfazer</button><button type="button" style={tb(false)} onClick={redo}><span style={{marginRight:4,fontWeight:700}}>↪</span>Refazer</button><button type="button" style={tb(showGrid)} onClick={toggleGrid}><AppIcon name="📐" size={14} mr={4}/>{showGrid?<>Grade<AppIcon name="✓" size={12} mr={0} /></>:"Grade"}</button><button type="button" style={tb(false)} onClick={north}><AppIcon name="🧭" size={14} mr={4}/>Norte</button><button type="button" style={{...tb(false),background:"#34c759",color:"#fff",borderColor:"#34c759"}} title="Inserir template de casa (paredes + porta + janela + cômodos)" aria-label="Inserir template de casa (paredes + porta + janela + cômodos" onClick={templateCasa}><AppIcon name="🏠" size={14} mr={4}/>Casa</button><button type="button" style={{...tb(false),background:"#5ac8fa",color:"#fff",borderColor:"#5ac8fa"}} title="Inserir template de via pública (rua + meio-fio + calçada)" aria-label="Inserir template de via pública (rua + meio-fio + calçada)" onClick={templateRua}><AppIcon name="🛣️" size={14} mr={4}/>Rua</button><button type="button" style={tb(false)} onClick={()=>{if(!canvasRef.current)return;const url=canvasRef.current.toDataURL("image/png");const a=document.createElement("a");a.href=url;a.download=mkFileName("png","Desenho");a.click();}}><AppIcon name="📥" size={14} mr={4}/>PNG</button><button type="button" style={{...tb(false),background:"#5856d6",color:"#fff",borderColor:"#5856d6"}} title="PNG 4x — alta resolução p/ impressão A3/A4" aria-label="PNG 4x — alta resolução p/ impressão A3/A4" onClick={()=>{if(!canvasRef.current||!overlayRef.current)return;const scale=4;const big=document.createElement("canvas");big.width=1200*scale;big.height=850*scale;const bc=big.getContext("2d");bc.fillStyle="#fff";bc.fillRect(0,0,big.width,big.height);bc.imageSmoothingEnabled=true;bc.imageSmoothingQuality="high";bc.drawImage(canvasRef.current,0,0,big.width,big.height);bc.drawImage(overlayRef.current,0,0,big.width,big.height);const url=big.toDataURL("image/png");const a=document.createElement("a");a.href=url;a.download=mkFileName("png","Desenho_HD");a.click();showToast("📥 PNG 4x ("+ (big.width)+"×"+(big.height)+")");}}><AppIcon name="📥" size={14} mr={4}/>PNG 4×</button><button type="button" style={tb(false)} onClick={()=>{if(!ctxRef.current)return;pH2();const ctx=ctxRef.current;ctx.save();ctx.strokeStyle="#333";ctx.fillStyle="#333";ctx.lineWidth=1.5;
ctx.beginPath();ctx.moveTo(30,800);ctx.lineTo(30+10*ppm,800);ctx.stroke();ctx.lineWidth=2;
for(let i=0;i<=10;i++){const xx=30+i*ppm;const h2=i%5===0?18:i%2===0?12:6;ctx.beginPath();ctx.moveTo(xx,800);ctx.lineTo(xx,800-h2);ctx.stroke();ctx.font="bold 12px sans-serif";ctx.textAlign="center";ctx.fillText(i+"m",xx,818);}
ctx.font="10px sans-serif";ctx.fillText("(escala de referência — "+Math.round(ppm)+"px/m)",230,832);ctx.restore();sv();}}><AppIcon name="📏" size={14} mr={4}/>Régua</button><button type="button" style={{...bt,background:"#4285f4",color:"#fff",fontSize:12}} onClick={openMaps}><AppIcon name="🗺️" size={14} mr={4}/>Maps</button><button type="button" style={{...bt,background:"#34c759",color:"#fff",fontSize:12}} onClick={()=>pickFile({accept:"image/*",onPick:(fls)=>loadMapImg({target:{files:fls}})})}><AppIcon name="📸" size={14} mr={4}/>Mapa→Canvas</button></div><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8,padding:"6px 10px",background:dark?"#1a1a2e":"#f0f0ff",borderRadius:8,border:`1px solid ${dark?"#2a2a4e":"#d0d0ff"}`}}><span style={{fontSize:11,fontWeight:600,color:t.ac,display:"inline-flex",alignItems:"center",gap:4}}><AppIcon name="⚖️" size={14} mr={0}/>Escala:</span><span style={{fontSize:11,color:t.t2}}>1m =</span><input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" min="10" max="200" value={ppm} onChange={e=>setPpm(Math.max(10,Math.min(200,+e.target.value||40)))} style={{...inp,width:60,fontSize:13,padding:"4px 8px",textAlign:"center"}}/><span style={{fontSize:11,color:t.t2}}>px</span><button type="button" style={{...tb(false),fontSize:10,padding:"4px 8px"}} onClick={()=>setPpm(40)}>Padrão</button><button type="button" style={{...tb(false),fontSize:10,padding:"4px 8px"}} onClick={()=>setPpm(20)}>Grande</button><button type="button" style={{...tb(false),fontSize:10,padding:"4px 8px"}} onClick={()=>setPpm(80)}>Detalhe</button></div><details style={{marginBottom:8}} open={!!stmp}><summary style={{fontSize:12,color:t.ac,cursor:"pointer",fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}><AppIcon name="📦" size={14} mr={0}/>Figuras</summary><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8,padding:10,background:t.bg3,borderRadius:8}}>{[["arma","🔫 Arma"],["estojo","🟡 Estojo"],["projetil","⚫ Projétil"],["faca","🔪 Faca"],["corda","〰️ Corda"],["sangue","🩸 Sangue"],["pessoaDeitada","🧎 Deitado"],["pessoaEmPe","🧍 Em pé"],["silhueta","💀 Contorno"],["veiculo","🚗 Carro"],["moto","🏍️ Moto"],["bicicleta","🚲 Bicicleta"],["porta","🚪 Porta"],["portao","🔲 Portão"],["escada","🪜 Escada"],["sofa","🛋️ Sofá"],["mesa","🪑 Mesa"],["cama","🛏️ Cama"],["pia","🚰 Pia"],["seta","➡️ Seta"],["regua","📏 Escala"],["arvore","🌲 Árvore"],["poste","💡 Poste"],["pegada","👣 Pegada"],["solado","👟 Solado"],["pneu","🔄 Pneu"],["pedra","🪨 Pedra"],["lixeira","🗑️ Lixeira"],["incendio","🔥 Incêndio"],["entradaX","❌ Marca X"]].map(([k,l])=><button type="button" key={k} style={tb(stmp===k)} onClick={()=>{if(stmp===k){setStmp(null);setTool("pen");}else{setStmp(k);setTool("stamp");}}}><IconText text={l} size={14} gap={4}/></button>)}{stmp&&<button type="button" style={{...tb(false),color:t.no}} onClick={()=>{setStmp(null);setTool("pen");setStampRot(0);}}>✕</button>}
</div>{stmp&&<><div style={{display:"flex",gap:8,alignItems:"center",marginTop:8,padding:"8px 10px",background:dark?"#1a2a1a":"#efe",borderRadius:8,fontSize:11,color:t.t2}}><AppIcon name="💡" size={14} mr={4}/>Coloque no canvas, depois use <b style={{color:t.ac,display:"inline-flex",alignItems:"center",gap:4}}><AppIcon name="👆" size={12} mr={0}/>Selecionar</b> para mover, girar (🔵↻) e redimensionar (🟢⤡)</div></>}
<div style={{display:"flex",gap:8,alignItems:"center",marginTop:8,padding:10,background:dark?"#1a2a1a":"#f0fff0",borderRadius:8,border:`1px solid ${dark?"#2a4a2a":"#c0e0c0"}`}}>
<span style={{fontSize:12,fontWeight:600,color:t.ac}}><AppIcon name="🏷️" size={14} mr={4}/>Placa:</span>
<select style={{...sel,width:"auto",minWidth:80,fontSize:14,padding:"8px 12px"}} value={stmp&&stmp.startsWith("placa_")?stmp:""} onChange={e=>{if(e.target.value){setStmp(e.target.value);setTool("stamp");}else{setStmp(null);setTool("pen");}}}>
<option value=""></option>
<optgroup label="Números">{Array.from({length:99},(_,i)=>i+1).map(n=><option key={"pn"+n} value={"placa_"+n}>{n}</option>)}</optgroup>
<optgroup label="Letras">{"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l=><option key={"pl"+l} value={"placa_"+l}>{l}</option>)}</optgroup>
</select>
{stmp&&stmp.startsWith("placa_")&&<span style={{fontSize:12,fontWeight:700,color:"#FFD700",background:"#333",padding:"4px 12px",borderRadius:6}}>{stmp.replace("placa_","")}</span>}
</div>{stmp&&<p style={{fontSize:11,color:t.wn,marginTop:6,fontWeight:500}}><AppIcon name="👆" size={14} mr={4}/>Clique no canvas — preview segue o cursor</p>}{tool==="select"&&<div style={{fontSize:11,color:t.ac,marginTop:6,padding:"8px 12px",background:t.ab,borderRadius:8,lineHeight:1.6}}><AppIcon name="👆" size={14} mr={4}/>Toque num stamp para selecionar. Arraste para mover.<br/>🔴 × = excluir &nbsp; 🔵 ↻ = girar 45° &nbsp; 🟢 ⤡ = redimensionar<br/>Stamps: {stampObjs.filter(s=>s.sheet===desenhoIdx).length} neste croqui</div>}</details>
{showTextInput&&<div style={{marginBottom:10,background:t.cd,border:`2px solid ${t.ac}`,borderRadius:12,padding:16}}><label style={{...lb,fontSize:12,marginBottom:8}}>Digite o texto:</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={{...inp,fontSize:18,marginBottom:10}} autoFocus value={textVal} onChange={e=>setTextVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")applyText();}}/><div style={{display:"flex",gap:8}}><button type="button" style={{...bt,background:t.ac,color:"#fff",flex:1,textAlign:"center"}} onClick={applyText}><AppIcon name="✓" size={14} mr={4}/>Inserir</button><button type="button" style={{...bt,background:"transparent",border:`1px solid ${t.bd}`,color:t.tx,flex:1,textAlign:"center"}} onClick={()=>{setShowTextInput(false);setTextVal("");}}><AppIcon name="✕" size={14} mr={4}/>Cancelar</button></div></div>}<div style={{display:"flex",gap:6,marginBottom:8,alignItems:"center",flexWrap:"wrap"}}><button type="button" style={{padding:"10px 18px",fontSize:14,fontWeight:600,background:tool==="select"?t.ac:"transparent",border:`2px solid ${tool==="select"?t.ac:t.bd}`,color:tool==="select"?"#fff":t.tx,cursor:"pointer",borderRadius:10,fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}} onClick={()=>{if(tool==="select"){setTool("pen");setSelStamp(null);}else{setTool("select");setStmp(null);}}}><AppIcon name="👆" size={16} mr={4}/>{tool==="select"?"SELECIONANDO":"Selecionar"}</button><span style={{width:1,height:24,background:t.bd}}/><button type="button" style={{...tb(false),fontSize:11}} onClick={()=>setZoomLvl(z=>Math.min(z+0.25,3))}><AppIcon name="🔍" size={12} mr={2}/>+</button><button type="button" style={{...tb(false),fontSize:11}} onClick={()=>setZoomLvl(z=>Math.max(z-0.25,0.5))}><AppIcon name="🔍" size={12} mr={2}/>−</button><button type="button" style={{...tb(false),fontSize:11}} onClick={()=>setZoomLvl(1)}>1:1</button><span style={{fontSize:11,color:t.t2}}>{Math.round(zoomLvl*100)}%</span><span style={{fontSize:10,color:t.t3,marginLeft:8}}>Shift+linha = snap 45°</span></div></div><div id="canvasArea" ref={canvasScrollRef} style={{borderRadius:10,overflow:"auto",border:`1px solid ${t.bd}`,maxHeight:zoomLvl>1?"90vh":"none",background:"#fff"}}><div style={{transform:`scale(${zoomLvl})`,transformOrigin:"top center",width:zoomLvl>1?`${100/zoomLvl}%`:"100%",maxWidth:1200,margin:"0 auto"}}><div style={{position:"relative"}}><canvas ref={canvasRef} width={1200} height={850} style={{width:"100%",display:"block",cursor:tool==="select"?"default":stmp?"copy":tool==="text"?"text":tool==="eraser"?"none":"crosshair",touchAction:"none",background:"#fff",willChange:"transform"}} onPointerDown={onD} onPointerMove={onM} onPointerUp={onU} onPointerCancel={onU}/><canvas ref={overlayRef} width={1200} height={850} style={{position:"absolute",top:0,left:0,width:"100%",pointerEvents:"none",touchAction:"none"}}/></div></div></div></Cd_>
{canvasVest.length>0&&<Cd_ styles={ST} title={`Vestígios do Croqui (${canvasVest.length})`} icon="🏷️"><div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}><button type="button" onClick={()=>{setVestCompact(v=>!v);setExpandedVest({});haptic("selection");}} title={vestCompact?"Expandir todos":"Compactar lista"} style={{padding:"6px 10px",fontSize:12,fontWeight:600,borderRadius:100,border:`1.5px solid ${vestCompact?t.ac:t.bd}`,background:vestCompact?(dark?"rgba(10,132,255,0.18)":"rgba(0,122,255,0.10)"):"transparent",color:vestCompact?t.ac:t.t2,cursor:"pointer",fontFamily:"inherit"}}>{vestCompact?<><AppIcon name="📂" size={12} mr={3}/>Expandir</>:<><AppIcon name="✨" size={12} mr={3}/>Compactar</>}</button></div>{canvasVest.map((v,i)=>{const isCollapsedCV=vestCompact&&!expandedVest["cv_"+v.id];const destC=(v.destino||"").includes("IC")?"#007aff":(v.destino||"").includes("II")?"#ff9500":"#FFD700";if(isCollapsedCV)return(<div key={v.id} onClick={()=>{setExpandedVest(p=>({...p,["cv_"+v.id]:true}));haptic("selection");}} style={{background:t.bg3,borderRadius:10,padding:"10px 12px",marginBottom:6,border:`0.5px solid ${t.bd}`,borderLeft:`4px solid ${destC}`,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:11,fontWeight:700,color:"#FFD700",background:"#333",padding:"2px 8px",borderRadius:6,fontVariantNumeric:"tabular-nums"}}>{v.placa}</span><span style={{flex:1,fontSize:13,color:t.tx,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.desc||<i style={{color:t.t3}}>sem descrição</i>}</span>{v.destino&&<span style={{fontSize:10,fontWeight:700,color:destC,background:`${destC}18`,padding:"2px 7px",borderRadius:6}}>{v.destino}</span>}{v.recolhido==="Sim"&&<span style={{fontSize:10,color:t.ok,fontWeight:700}}>✓</span>}<span style={{fontSize:14,color:t.t3}}>›</span></div>);return(<div key={v.id} style={{background:t.bg3,borderRadius:10,padding:12,marginBottom:8,border:`1.5px solid ${t.bd}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:14,fontWeight:700,color:"#FFD700",background:"#333",padding:"2px 10px",borderRadius:6,display:"inline-flex",alignItems:"center",gap:6}}>Placa {v.placa}{vestCompact&&<button type="button" onClick={()=>setExpandedVest(p=>{const nx={...p};delete nx["cv_"+v.id];return nx;})} style={{background:"transparent",border:"none",color:"#FFD700",cursor:"pointer",fontSize:11,padding:"2px 4px",fontFamily:"inherit"}}>▲</button>}</span><FotoBtn rk={"placa_"+v.placa}/><button type="button" style={{background:"rgba(255,59,48,0.12)",border:`1.5px solid ${t.no}`,color:t.no,cursor:"pointer",fontSize:20,fontWeight:700,borderRadius:10,padding:"4px 12px",minWidth:40,minHeight:44,lineHeight:1,fontFamily:"inherit"}} title="Remover vestígio do croqui" aria-label="Remover vestígio do croqui" onClick={()=>{const hasData=!!(v.desc||v.suporte||v.obs);const doDel=()=>setCanvasVest(canvasVest.filter((_,j)=>j!==i));if(hasData){reqDel(`Remover Placa ${v.placa}?`,v.desc?`"${v.desc.slice(0,70)}"`:"(sem descrição)",doDel);}else{doDel();haptic("medium");}}}>×</button></div><div><label style={lb}>Descrição do vestígio</label><VestPk val={v.desc} onSelect={val2=>{setCanvasVest(prev=>prev.map((v,j)=>j===i?{...v,desc:val2}:v));}} styles={ST}/><TX_ inputKey={"cvdesc-"+v.id+"-"+(v.desc||"")} value={v.desc} placeholder="Descrição do vestígio" inputStyle={inp} onCommit={(val)=>{setCanvasVest(prev=>prev.map((v,j)=>j===i?{...v,desc:val}:v));}}/></div><div style={{marginTop:8}}><label style={lb}>Suporte / Local</label><TX_ value={v.suporte} inputStyle={inp} onCommit={(val)=>{setCanvasVest(prev=>prev.map((v,j)=>j===i?{...v,suporte:val}:v));}}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:8}}><div><label style={lb}>Dist. 1</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={{...inp,fontSize:12}} defaultValue={v.coord1} onBlur={e=>{setCanvasVest(prev=>prev.map((v,j)=>j===i?{...v,coord1:e.target.value}:v));}}/></div><div><label style={lb}>Dist. 2</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={{...inp,fontSize:12}} defaultValue={v.coord2} onBlur={e=>{setCanvasVest(prev=>prev.map((v,j)=>j===i?{...v,coord2:e.target.value}:v));}}/></div><div><label style={lb}>Altura</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={{...inp,fontSize:12}} defaultValue={v.altura} onBlur={e=>{setCanvasVest(prev=>prev.map((v,j)=>j===i?{...v,altura:e.target.value}:v));}}/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><div><label style={lb}>Recolhido?</label><div style={{display:"flex"}}><button type="button" style={tY(v.recolhido==="Sim")} onClick={()=>{setCanvasVest(prev=>prev.map((v,j)=>j===i?{...v,recolhido:"Sim"}:v));}}>S</button><button type="button" style={tN(v.recolhido==="Não")} onClick={()=>{setCanvasVest(prev=>prev.map((v,j)=>j===i?{...v,recolhido:"Não"}:v));}}>N</button></div></div><div><label style={lb}>Destino</label><div style={{display:"flex",gap:4}}>{["IC","II"].map(dd=>{const ds=(v.destino||"").split("+").filter(Boolean);const isOn=ds.includes(dd);return <button type="button" key={dd} style={{padding:"7px 14px",fontSize:13,borderRadius:8,border:`1.5px solid ${isOn?"#007aff":t.bd}`,background:isOn?"rgba(0,122,255,0.12)":"transparent",color:isOn?"#007aff":t.t3,cursor:"pointer",fontFamily:"inherit",fontWeight:isOn?600:400}} onClick={()=>{setCanvasVest(prev=>prev.map((v,j)=>{if(j!==i)return v;const ds2=(v.destino||"").split("+").filter(Boolean);const idx2=ds2.indexOf(dd);return{...v,destino:idx2>-1?ds2.filter(x=>x!==dd).join("+"):[...ds2,dd].join("+")};}));}}>{dd}</button>;})}
</div></div></div><div style={{marginTop:8}}><F_ k={"cvobs_"+v.id} label={`Observações — Vestígio Canvas ${v.placa||(i+1)}`} type="textarea" val={v.obs||""} onChange={(_k,val)=>{setCanvasVest(prev=>prev.map((v2,j)=>j===i?{...v2,obs:val}:v2));}} styles={ST}/></div></div>);})}
</Cd_>}

{navBtns()}
</>);}
  // ╔════════════════════════════════════════╗
  // ║  ABA 6 — EXPORTAR (PDF, DOCX, JSON)     ║
  // ╚════════════════════════════════════════╝
if(tab===TAB_EXPORTAR){if(exportView==="pdf"||exportView==="rrv")return(<div style={{background:"#fff",minHeight:"80vh",margin:"-16px",padding:0}}><div style={{position:"sticky",top:"calc(88px + env(safe-area-inset-top))",zIndex:50,background:"#f0f0f5",borderBottom:"2px solid #007aff",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}><span style={{fontWeight:700,fontSize:15,color:"#222"}}>{pdfTitle}</span><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{pdfReady==="fail"?<button type="button" style={{...bt,background:"#999",color:"#fff",padding:"10px 20px",fontSize:14,cursor:"pointer"}} title="Biblioteca PDF não carregou. Toque para tentar de novo." aria-label="Biblioteca PDF não carregou. Toque para tentar de novo." onClick={async()=>{setPdfReady("loading");try{await loadH2P();setPdfReady("ok");showToast("✅ Biblioteca PDF carregada");}catch(e){setPdfReady("fail");showToast("❌ Sem rede — tente conectar e retentar");}}}><AppIcon name="📄" size={14} mr={4}/>PDF indisponível ↻</button>:<button type="button" style={{...bt,background:"#ff3b30",color:"#fff",padding:"10px 20px",fontSize:14,opacity:pdfBusy||pdfReady==="loading"?0.6:1}} disabled={pdfBusy||pdfReady==="loading"} onClick={()=>savePDF(pdfTitle)}>{pdfBusy?"⏳ Gerando…":(pdfReady==="loading"?"⏳ Carregando lib…":"📄 Baixar PDF")}</button>}
<button type="button" style={{...bt,background:t.ac,color:"#fff",padding:"10px 16px",fontSize:13}} onClick={smartSaveDocx}><AppIcon name="📝" size={14} mr={4}/>Baixar DOCX</button><button type="button" style={{...bt,background:t.bg3,color:t.tx,border:`1px solid ${t.bd}`,padding:"10px 16px",fontSize:13}} onClick={()=>copyHTML(pdfHTML,pdfTitle)}><AppIcon name="📋" size={14} mr={4}/>Copiar HTML</button><button type="button" style={{...bt,background:"#e5e5ea",color:"#333",padding:"8px 16px",fontSize:13}} onClick={()=>{if(pdfDataUrl)try{URL.revokeObjectURL(pdfDataUrl);}catch(e){console.warn("CQ:",e);}setExportView(null);setPdfHTML("");setPdfDataUrl(null);setPdfViewOpen(false);}}>← Voltar</button></div></div>{copyOk&&<div style={{background:"#34c759",color:"#fff",padding:"10px 14px",fontSize:12,fontWeight:600,textAlign:"center",borderRadius:0}}>{copyOk}</div>}{/* SEGURANÇA dupla: pdfHTML é gerado internamente por bPDF()/bRRV() com esc() em todos os campos do usuário. v242: DOMPurify como cinto-de-segurança extra (protege contra bug futuro em esc() ou backup JSON malicioso). */}<div id="pdf-preview" style={{padding:"24px 20px",maxWidth:800,margin:"0 auto",color:"#222",fontSize:12,lineHeight:1.5,background:"#fff"}} dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(pdfHTML,{USE_PROFILES:{html:true},ADD_TAGS:["style"],ADD_ATTR:["target"]})}}/></div>);
return(<><div style={{background:t.successBgS,border:`1.5px solid ${t.successBd}`,borderRadius:12,padding:14,marginBottom:12,display:"flex",flexWrap:"wrap",gap:12,justifyContent:"center"}}>{[["📋",data.oc?`Oc.${data.oc}/${(data.oc_ano||"").slice(-2)}`:"—"],["🏢",data.dp||"—"],["🧪",`${vestigios.filter(v=>v.desc).length} vest.`],["💀",`${cadaveres.filter((_,ci)=>{const cx2="c"+ci+"_";return data[cx2+"fx"]||data[cx2+"dg"]||data[cx2+"sx"]||wounds.some(w=>w.cadaver===ci);}).length} cad.`],["📷",`${fotos.length} fotos`],["🚗",`${veiculos.filter((_,i)=>data["v"+i+"_tipo"]||data["v"+i+"_placa"]).length} veíc.`],["🩸",`${trilhas.length} trilhas`]].map(([ic,tx],i)=><span key={i} style={{display:"inline-flex",alignItems:"center",fontSize:12,color:t.tx,fontWeight:600,padding:"6px 11px",borderRadius:100,background:dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)",border:`1px solid ${dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)"}`,letterSpacing:-0.1}}><AppIcon name={ic} size={16} mr={5}/>{tx}</span>)}</div>{(()=>{const warns=checkCampos();if(!warns.length)return null;const byAba={};warns.forEach(w=>{if(!byAba[w.aba])byAba[w.aba]=[];byAba[w.aba].push(w.campo);});return(<div style={{background:t.warningBg,border:`1.5px solid ${t.warningBd}`,borderRadius:12,padding:14,marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:18}}>⚠️</span><span style={{fontSize:14,fontWeight:700,color:dark?"#ffcc00":"#856404"}}>{warns.length} campo{warns.length>1?"s":""} não preenchido{warns.length>1?"s":""}</span></div>{Object.entries(byAba).map(([aba,campos])=>(<div key={aba} style={{marginBottom:6}}><span style={{fontSize:12,fontWeight:700,color:dark?"#ffcc00":"#856404"}}>{aba}:</span><span style={{fontSize:12,color:dark?"#ddd":"#664400",marginLeft:4}}>{campos.join(", ")}</span></div>))}</div>);})()}{(()=>{const fotoKB=fotos.reduce((s,f)=>s+(f.sizeKB||0),0);let dadosKB=0;try{dadosKB=Math.round(new Blob([JSON.stringify({dados:data,vestigios,canvasVest,vestes,papilos,wounds,edificacoes,veiVest,trilhas,cadaveres,veiculos,desenho:imgRef.current,desenhos,stampObjs,ppm})]).size/1024);}catch(e){dadosKB=0;}const totalKB=fotoKB+dadosKB;const limitKB=quotaKB;const pct=Math.min(100,Math.round(totalKB/limitKB*100));const warn=pct>=90;const mid=pct>=70&&!warn;const barColor=warn?t.no:(mid?"#ff9500":t.ok);const fmtMB=(kb)=>kb>=1048576?(kb/1048576).toFixed(2)+" GB":kb>=1024?(kb/1024).toFixed(2)+" MB":kb+" KB";return(<div style={{background:t.cd,borderRadius:14,padding:"14px 18px",marginBottom:14,boxShadow:dark?"0 1px 3px rgba(0,0,0,0.4),0 0 0 0.5px rgba(255,255,255,0.05)":"0 1px 3px rgba(0,0,0,0.06),0 0 0 0.5px rgba(0,0,0,0.04)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:8}}><HardDrive size={16} color={t.t2}/><span style={{fontSize:14,fontWeight:700,color:t.tx}}>Armazenamento</span></div><span style={{fontSize:13,fontWeight:600,color:barColor}}>{fmtMB(totalKB)} <span style={{color:t.t3,fontWeight:500}}>/ {fmtMB(quotaKB)}</span></span></div><div style={{height:8,background:t.bg3,borderRadius:4,overflow:"hidden",marginBottom:8}}><div style={{width:pct+"%",height:"100%",background:barColor,transition:"width 0.3s"}}/></div><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:t.t2}}><span><AppIcon name="📝" size={14} mr={4}/>Dados: <b style={{color:t.tx}}>{fmtMB(dadosKB)}</b></span><span><AppIcon name="📷" size={14} mr={4}/>Fotos: <b style={{color:t.tx}}>{fmtMB(fotoKB)}</b> ({fotos.length})</span><span style={{color:barColor,fontWeight:600}}>{pct}%</span></div>{warn&&<p style={{fontSize:11,color:t.no,margin:"8px 0 0",lineHeight:1.4}}>⚠️ Próximo do limite. Considere baixar backup e iniciar um novo croqui, ou desligar <b>alta qualidade</b> (📷✨) antes de tirar mais fotos.</p>}{mid&&!warn&&<p style={{fontSize:11,color:"#b26a00",margin:"8px 0 0",lineHeight:1.4}}>💡 Uso moderado. Ainda cabem fotos, mas já dá pra pensar em backup preventivo.</p>}</div>);})()}
{/* === PACOTE COMPLETO — ação principal === */}
<Cd_ styles={ST} title="Pacote Completo" aria-label="Pacote Completo" icon="📦" variant="success">
<p style={{fontSize:12,color:t.t2,margin:"0 0 12px",lineHeight:1.5}}>Gera um ZIP com: <b>Croqui PDF + DOCX + Backup JSON{fotos.length>0?` + ${fotos.length} foto(s)`:""}</b>.</p>
<div style={{fontSize:11,color:dark?"#ffcc00":"#856404",background:dark?"rgba(255,204,0,0.08)":"rgba(255,204,0,0.15)",border:`1px solid ${dark?"rgba(255,204,0,0.25)":"rgba(255,204,0,0.4)"}`,borderRadius:8,padding:"8px 10px",marginBottom:12,lineHeight:1.45,display:"flex",gap:6,alignItems:"flex-start"}}><span style={{fontSize:14,flexShrink:0}}>ℹ️</span><span><b>RRV não vai no pacote.</b> Como precisa da assinatura do papiloscopista, gere ele separado pelo botão <b>"RRV PDF"</b> abaixo no momento que ele estiver disponível.</span></div>
<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
<button type="button" style={{...bt,background:`linear-gradient(135deg,${t.ac} 0%,${t.ac}cc 100%)`,color:"#fff",fontWeight:700,boxShadow:`0 2px 8px ${t.ac}55`,padding:"12px 16px",fontSize:14,flex:1,minWidth:140,textAlign:"center",justifyContent:"center"}} onClick={()=>exportAllZip(true)} aria-label="Compartilhar pacote ZIP"><AppIcon name="📤" size={16} mr={4}/>Compartilhar ZIP</button>
<button type="button" style={{...bt,background:t.bg3,color:t.tx,border:`1.5px solid ${t.bd}`,padding:"12px 16px",fontSize:14,flex:1,minWidth:140,textAlign:"center",justifyContent:"center"}} onClick={()=>exportAllZip(false)} aria-label="Baixar pacote ZIP"><AppIcon name="💾" size={16} mr={4}/>Baixar ZIP</button>
</div></Cd_>

{/* === EXPORTAR INDIVIDUAL === */}
<Cd_ styles={ST} title="Exportar Individual" aria-label="Exportar Individual" icon="📄" variant="info">
<p style={{fontSize:12,color:t.t2,margin:"0 0 12px",lineHeight:1.5}}>Gera um arquivo de cada vez. Clique em "Croqui" ou "RRV" para visualizar antes; clique em "Baixar PDF" pra salvar.</p>
<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{(()=>{const pend=checkCampos().length;return(<span style={{position:"relative",display:"inline-flex"}}><button type="button" style={{...bt,background:t.ac,color:"#fff"}} onClick={()=>{forceSaveCanvas();setPdfHTML(bPDF());setPdfTitle("Croqui de Levantamento de Local");setExportView("pdf");}}><AppIcon name="📑" size={14} mr={4}/>Croqui PDF</button>{pend>0&&<span title={`${pend} campo${pend>1?"s":""} pendente${pend>1?"s":""}`} style={{position:"absolute",top:-6,right:-6,background:"#ff9500",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:10,minWidth:20,textAlign:"center",lineHeight:1.2,boxShadow:"0 1px 4px rgba(0,0,0,0.3)",border:"2px solid "+t.cd}}>{pend}</span>}</span>);})()}<button type="button" style={{...bt,background:"#ff9500",color:"#fff"}} onClick={()=>{forceSaveCanvas();setPdfHTML(bRRV());setPdfTitle("RRV");setExportView("rrv");}}><AppIcon name="📋" size={14} mr={4}/>RRV PDF</button>
<button type="button" style={{...bt,background:"#28a745",color:"#fff"}} onClick={saveCroquiDocx} title="Baixar DOCX para o Documents/Downloads do dispositivo" aria-label="Baixar DOCX"><AppIcon name="📝" size={14} mr={4}/>DOCX</button><button type="button" style={{...bt,background:"#25D366",color:"#fff",fontWeight:700}} onClick={shareCroquiDocx} title="Enviar DOCX por WhatsApp, e-mail ou AirDrop" aria-label="Enviar DOCX por WhatsApp ou e-mail"><AppIcon name="📤" size={14} mr={4}/>Enviar DOCX</button>
<button type="button" style={{...bt,background:t.bg3,color:t.tx,border:`1px solid ${t.bd}`}} onClick={()=>{setExportData(sum());setExportView("txt");}}><AppIcon name="📋" size={14} mr={4}/>Texto</button>
</div></Cd_>

{/* === BACKUP JSON === */}
<Cd_ styles={ST} title="Backup" aria-label="Backup" icon="💾" variant="primary">
<p style={{fontSize:12,color:t.t2,margin:"0 0 12px",lineHeight:1.5}}>Salva ou restaura todos os dados deste laudo num arquivo JSON. Útil para mover de celular ou guardar offline.</p>
<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
<button type="button" style={{...bt,background:t.ac,color:"#fff"}} onClick={()=>{try{const bk=JSON.stringify({_v:APP_VERSION,dados:data,vestigios,canvasVest,vestes,papilos,wounds,edificacoes,veiVest,trilhas,cadaveres,veiculos,desenho:imgRef.current,desenhos,stampObjs,fotos,ppm,perito:loginName,matricula:loginMat,timestamp:new Date().toISOString()});const blob=new Blob([bk],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=mkFileName("json","Backup");document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(url),5000);showToast("✅ Backup baixado!");}catch(e){showToast("❌ Erro: "+e.message);}}}><AppIcon name="💾" size={14} mr={4}/>Baixar JSON</button>
<button type="button" style={{...bt,background:t.bg3,color:t.tx,border:`1px solid ${t.bd}`}} onClick={()=>pickFile({accept:".json,.zip",onPick:(fls)=>doImportBackupFile(fls[0])})}><AppIcon name="📂" size={14} mr={4}/>Importar JSON / ZIP</button>
</div></Cd_>
{exportView==="txt"&&<Cd_ styles={ST} title="Texto" aria-label="Texto" icon="📝" variant="slate"><button type="button" style={{...bt,background:t.ac,color:"#fff",marginBottom:12,fontSize:13}} onClick={()=>{const txt=sum();const copyFallback=(t2)=>{const ta=document.createElement("textarea");ta.value=t2;ta.style.cssText="position:fixed;left:-9999px;top:0;opacity:0";document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand("copy");showToast("✅ Copiado!");}catch(e2){showToast("❌ Falha ao copiar");}document.body.removeChild(ta);};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(()=>showToast("✅ Copiado!")).catch(()=>copyFallback(txt));}else{copyFallback(txt);}}}><AppIcon name="📋" size={14} mr={4}/>Copiar</button><pre style={{whiteSpace:"pre-wrap",fontFamily:"monospace",fontSize:11,color:t.tx,background:t.bg3,padding:16,borderRadius:8,maxHeight:400,overflowY:"auto"}}>{exportData}</pre></Cd_>}
<Cd_ styles={ST} title="Resumo" aria-label="Resumo" icon="📊" variant="teal"><div style={{background:t.bg3,borderRadius:10,padding:16,fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"inherit",color:t.tx,maxHeight:500,overflowY:"auto"}}>{sum()}</div></Cd_>
{fotos.length>0&&<Cd_ styles={ST} variant="info" title={`📷 Galeria de Fotos (${fotos.length})`} icon="🖼️"><div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>{[["","Todas",-1],["solicitacao","Solicitação",TAB_SOLICITACAO],["local","Local",TAB_LOCAL],["vestigios","Vestígios",TAB_VESTIGIOS],["cadaver","Cadáver",TAB_CADAVER],["veiculo","Veículo",TAB_VEICULO]].map(([v,l,ti])=><button type="button" key={v} style={{padding:"8px 12px",fontSize:11,borderRadius:18,minHeight:36,border:`1px solid ${fotoFilter===v?t.ac:t.bd}`,background:fotoFilter===v?t.ab:"transparent",color:fotoFilter===v?t.ac:t.t2,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>setFotoFilter(fotoFilter===v?"":v)}>{l} ({v===""?fotos.length:fotos.filter(f=>fotoTab(f.ref)===ti).length})</button>)}{["Antes da perícia","Durante a perícia","Após a perícia"].map(fase=><button type="button" key={fase} style={{padding:"8px 12px",fontSize:11,borderRadius:18,minHeight:36,border:`1px solid ${fotoFilter===fase?t.ac:t.bd}`,background:fotoFilter===fase?t.ab:"transparent",color:fotoFilter===fase?t.ac:t.t2,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>setFotoFilter(fotoFilter===fase?"":fase)}>{fase.replace("da perícia","")} ({fotos.filter(f=>f.fase===fase).length})</button>)}</div>
<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{fotos.filter(f=>{if(!fotoFilter)return true;const tabMap={"solicitacao":TAB_SOLICITACAO,"local":TAB_LOCAL,"vestigios":TAB_VESTIGIOS,"cadaver":TAB_CADAVER,"veiculo":TAB_VEICULO};if(tabMap[fotoFilter]!==undefined)return fotoTab(f.ref)===tabMap[fotoFilter];return f.fase===fotoFilter;}).map((f,i)=><div key={f.id} style={{position:"relative",cursor:"pointer"}} onClick={()=>setEditFotoId(f.id)}><img src={f.dataUrl} loading="lazy" style={{width:80,height:80,objectFit:"cover",borderRadius:8,border:`2px solid ${f.desc?t.ok:t.bd}`}}/><div style={{fontSize:8,color:t.t2,textAlign:"center",maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.desc?.slice(0,15)||"sem desc"}</div></div>)}</div></Cd_>}
<Cd_ styles={ST} title={"Slots de Salvamento (Slot "+(slotIdx+1)+" ativo)"} icon="💾"><p style={{fontSize:12,color:t.t2,marginBottom:10,lineHeight:1.6}}>Você tem <b>5 gavetas</b> para salvar croquis. O auto-save grava no slot ativo.</p><div style={{display:"flex",flexDirection:"column",gap:6}}>{[0,1,2,3,4].map(si=>{const sd=getSlot(si);const isActive=slotIdx===si;// v205: extrai miniatura do desenho (primeiro croqui)
const thumb=(()=>{if(!sd||!sd.desenho)return null;if(typeof sd.desenho==="string")return sd.desenho;if(typeof sd.desenho==="object"){const k=Object.keys(sd.desenho)[0];return sd.desenho[k]||null;}return null;})();
return(<div key={si} style={{background:isActive?(dark?"#1a2a1a":"#e8f5e9"):(dark?"#1c1c1e":"#f8f8fa"),border:`2px solid ${isActive?t.ok:t.bd}`,borderRadius:10,padding:12,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>{/* Miniatura */}<div style={{flexShrink:0,width:64,height:46,borderRadius:6,background:dark?"#0a0a0a":"#fff",border:`1px solid ${t.bd}`,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>{thumb?<img src={thumb} alt="Miniatura do croqui" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}} loading="lazy"/>:<span style={{fontSize:18,opacity:0.3}}>📋</span>}{sd&&sd.fotos&&sd.fotos.length>0&&<span style={{position:"absolute",bottom:1,right:2,fontSize:8,fontWeight:700,background:"rgba(0,122,255,0.9)",color:"#fff",padding:"1px 4px",borderRadius:6,lineHeight:1}}>📷{sd.fotos.length}</span>}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:isActive?t.ok:t.tx}}>Slot {si+1} {isActive?"(ativo)":""}</div>{sd?(<><p style={{fontSize:11,color:t.t2,margin:"4px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Oc.: <b>{sd.data?.oc||"—"}/{(sd.data?.oc_ano||"").slice(-2)}</b> {sd.data?.dp||""} — {sd.data?.nat||""}</p><p style={{fontSize:10,color:t.t3,margin:"2px 0 0"}}>Salvo: {fmtDt(sd.timestamp)}</p></>):(<p style={{fontSize:11,color:t.t3,margin:"4px 0 0",fontStyle:"italic"}}>Vazio</p>)}</div><div style={{display:"flex",gap:4,flexShrink:0}}>{sd&&<button type="button" style={{...tb(false),fontSize:11,padding:"6px 10px"}} onClick={async()=>{try{const bd=await loadFullSlot("cq_"+loginMat+"_"+si);if(bd){setRecupData({...bd,_slotIdx:si});setShowConfirmRecup(true);}else{showToast("❌ Slot vazio");}}catch(e){showToast("❌ Erro");}}}><AppIcon name="📂" size={14} mr={4}/>Abrir</button>}{!sd&&!isActive&&<button type="button" style={{...tb(false),fontSize:11,padding:"6px 10px"}} onClick={()=>{setSlotIdx(si);showToast("✅ Slot "+(si+1)+" ativado!");}}><AppIcon name="✚" size={14} mr={4}/>Usar</button>}{sd&&<button type="button" style={{background:"rgba(255,59,48,0.12)",border:`1.5px solid ${t.no}`,color:t.no,cursor:"pointer",fontSize:18,fontWeight:700,borderRadius:8,padding:"4px 10px",minWidth:44,minHeight:44,lineHeight:1,fontFamily:"inherit"}} title="Apagar slot" aria-label="Apagar slot" onClick={async()=>{await deleteFullSlot("cq_"+loginMat+"_"+si);setSavedSlots(prev=>prev.filter(s=>s.slot!==si));if(isActive)resetAll(true);haptic("medium");showToast("🗑️ Slot "+(si+1)+" apagado");}}>×</button>}</div></div>);})}
</div><button type="button" style={{...abtn,marginTop:8}} onClick={reloadSlots}><AppIcon name="🔄" size={14} mr={4}/>Atualizar slots</button></Cd_>
{/* === AVANÇADO (recolhível) === */}
<Cd_ styles={ST} title="Avançado" aria-label="Avançado" icon="⚙️" variant="slate">
<button type="button" style={{width:"100%",background:"transparent",border:"none",color:t.t2,cursor:"pointer",fontSize:13,fontFamily:"inherit",padding:"6px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}} onClick={()=>setAdvExpanded(x=>!x)} aria-expanded={advExpanded}>
<span><AppIcon name="🛠️" size={14} mr={6}/>Ferramentas técnicas {advExpanded?"":"(toque para expandir)"}</span>
<span style={{fontSize:14,color:t.t3}}>{advExpanded?"▲":"▼"}</span>
</button>
{advExpanded&&<div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${t.bd}`}}>
<p style={{fontSize:11,color:t.t2,margin:"0 0 12px",lineHeight:1.5,fontStyle:"italic"}}>Use estas ferramentas só se souber o que está fazendo. Algumas apagam dados sem volta.</p>

{/* Diagnóstico + Reset libs */}
<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
<button type="button" style={{...bt,background:t.bg3,color:t.tx,border:`1px solid ${t.bd}`,fontSize:12}} onClick={()=>setShowDiag(true)} aria-label="Tela de diagnóstico"><AppIcon name="🔍" size={14} mr={4}/>Diagnóstico</button>
<button type="button" style={{...bt,background:t.bg3,color:t.tx,border:`1px solid ${t.wn}`,fontSize:12}} onClick={async()=>{try{let removed=0;for(const k of Object.keys(localStorage)){if(k.startsWith("cq_lib_")){localStorage.removeItem(k);removed++;}}delete window.html2pdf;delete window.JSZip;setPdfReady(false);showToast(`✅ ${removed} bibliotecas resetadas — recarregando…`);haptic("medium");setTimeout(()=>window.location.reload(),1500);}catch(e){showToast("❌ "+e.message);}}} aria-label="Resetar cache de bibliotecas e recarregar app"><AppIcon name="🔄" size={14} mr={4}/>Resetar libs</button>
</div>

{/* Limpeza de memória */}
<div style={{padding:12,background:t.warningBg,border:`1.5px solid ${t.warningBd}`,borderRadius:10}}>
<p style={{fontSize:12,fontWeight:700,color:t.tx,margin:"0 0 6px"}}><AppIcon name="🧹" size={14} mr={4}/>Limpeza de Memória</p>
<p style={{fontSize:11,color:t.t2,margin:"0 0 10px",lineHeight:1.5}}>Apagar slots deste perito (matrícula <b>{loginMat}</b>). <b>Faça backup JSON antes — não há volta.</b></p>
<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
<button type="button" style={{...bt,background:t.bg3,color:t.tx,border:`1.5px solid ${t.warningBd}`,padding:"10px 14px",fontSize:12,fontWeight:600}} onClick={()=>reqDel(`Apagar Slot ${slotIdx+1}?`,`O Slot ${slotIdx+1} (ativo) será apagado.\nOs outros slots continuam intactos.\n\nFaça backup JSON antes — não há volta.`,async()=>{try{await deleteFullSlot("cq_"+loginMat+"_"+slotIdx);setSavedSlots(prev=>prev.filter(s=>s.slot!==slotIdx));resetAll(true);haptic("medium");showToast("🗑️ Slot "+(slotIdx+1)+" limpo");}catch(e){showToast("❌ Erro: "+e.message);}},{okLabel:"Apagar slot",okIcon:"🗑️"})}><AppIcon name="🗑️" size={14} mr={4}/>Limpar slot ATIVO ({slotIdx+1})</button>
<button type="button" style={{...bt,background:t.dangerBg,color:t.no,border:`1.5px solid ${t.no}`,padding:"10px 14px",fontSize:12,fontWeight:700}} onClick={()=>{setDeleteAllInput("");setShowConfirmDeleteAll(true);}}><AppIcon name="🔥" size={14} mr={4}/>Apagar TODOS os slots</button>
</div>
</div>
</div>}
</Cd_>
{/* v234: versão discreta no rodapé da aba Exportar */}
<div style={{textAlign:"center",fontSize:10,color:t.t3,marginTop:18,marginBottom:8,letterSpacing:0.3,fontVariantNumeric:"tabular-nums",opacity:0.7}}>Xandroid · {APP_VERSION}</div>
{navBtns()}</>);}
return null;};

  // ╔════════════════════════════════════════╗
  // ║  TELA DE LOGIN                          ║
  // ╚════════════════════════════════════════╝
if(!loggedIn){const isPink=accent==="pink";const bgLogin=isPink?"radial-gradient(ellipse at top,#3a1828 0%,#1a0a14 60%,#0a0508 100%)":"radial-gradient(ellipse at top,#1a2c45 0%,#0a1420 60%,#050a12 100%)";const accentCol=isPink?"#ff6b9d":"#5ac8fa";const accentGlow=isPink?"rgba(255,107,157,0.25)":"rgba(90,200,250,0.25)";const accentGlowSubtle=isPink?"rgba(255,107,157,0.22)":"rgba(90,200,250,0.22)";const skullBg1=isPink?"#7a1a4a":"#1a4a7a";const skullBg2=isPink?"#40051f":"#0a2540";const btnGrad=isPink?"linear-gradient(135deg,#d6336c 0%,#ff6b9d 100%)":"linear-gradient(135deg,#0a84ff 0%,#5ac8fa 100%)";const btnShadow=isPink?"0 6px 18px rgba(214,51,108,0.35),inset 0 1px 0 rgba(255,255,255,0.2)":"0 6px 18px rgba(10,132,255,0.35),inset 0 1px 0 rgba(255,255,255,0.2)";return(<div style={{fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif",color:t.tx,minHeight:"100vh",overscrollBehavior:"none",display:"flex",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden",background:bgLogin}}>
<style dangerouslySetInnerHTML={{__html:`
@keyframes loginShine{0%{left:-60%}100%{left:160%}}
@keyframes loginFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes bloodDrop{0%{opacity:0;transform:translateY(0) scaleY(0.3)}15%{opacity:0.85;transform:translateY(2px) scaleY(1)}60%{opacity:0.85;transform:translateY(18px) scaleY(1.2)}85%{opacity:0.4;transform:translateY(28px) scaleY(1.4)}100%{opacity:0;transform:translateY(34px) scaleY(1.6)}}
.login-input-focus:focus{outline:none!important;border-color:${accentCol}!important;box-shadow:0 0 0 3px ${accentGlow}!important;transition:all 0.2s ease}
.login-btn-sheen{position:relative;overflow:hidden}
.login-btn-sheen::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(110deg,transparent,rgba(255,255,255,0.2),transparent);animation:loginShine 5s ease-in-out infinite;pointer-events:none}
`}}/>
<div style={{background:isPink?"rgba(40,18,28,0.85)":"rgba(18,26,40,0.85)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderRadius:22,padding:36,maxWidth:400,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",position:"relative",zIndex:1,animation:"loginFadeUp 0.4s cubic-bezier(0.22,1,0.36,1)"}}>
<div style={{textAlign:"center",marginBottom:28}}>
<svg viewBox="0 0 200 200" style={{width:88,height:88,marginBottom:10,display:"block",margin:"0 auto 10px auto",filter:`drop-shadow(0 0 18px ${accentGlowSubtle})`}}><defs><radialGradient id="logoBg" cx="50%" cy="40%"><stop offset="0%" stopColor={skullBg1}/><stop offset="100%" stopColor={skullBg2}/></radialGradient><linearGradient id="logoSk" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#f8f8fa"/><stop offset="100%" stopColor="#d1d1d6"/></linearGradient><linearGradient id="bloodG" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#8b0000"/><stop offset="60%" stopColor="#b30000"/><stop offset="100%" stopColor="#6a0000"/></linearGradient></defs><circle cx="100" cy="100" r="98" fill="url(#logoBg)"/><path d="M100 40 C70 40 48 62 48 95 C48 115 56 130 70 138 L70 155 Q70 162 78 162 L82 162 L82 158 C82 154 85 152 88 152 C91 152 94 154 94 158 L94 162 L106 162 L106 158 C106 154 109 152 112 152 C115 152 118 154 118 158 L118 162 L122 162 Q130 162 130 155 L130 138 C144 130 152 115 152 95 C152 62 130 40 100 40 Z" fill="url(#logoSk)" stroke="#a1a1a6" strokeWidth="1.5"/><ellipse cx="78" cy="98" rx="14" ry="16" fill={skullBg2}/><ellipse cx="122" cy="98" rx="14" ry="16" fill={skullBg2}/><circle cx="74" cy="93" r="2.5" fill={accentCol}/><circle cx="118" cy="93" r="2.5" fill={accentCol}/><path d="M100 115 L94 130 L100 134 L106 130 Z" fill={skullBg2}/><path d="M82 148 L82 156 M88 148 L88 156 M94 148 L94 156 M100 148 L100 156 M106 148 L106 156 M112 148 L112 156 M118 148 L118 156" stroke="#a1a1a6" strokeWidth="0.6" opacity="0.4"/><ellipse cx="80" cy="118" rx="3" ry="4.8" fill="url(#bloodG)" style={{transformOrigin:"80px 114px",animation:"bloodDrop 5s ease-in-out infinite",animationDelay:"0.8s"}}/><ellipse cx="120" cy="118" rx="3" ry="4.8" fill="url(#bloodG)" style={{transformOrigin:"120px 114px",animation:"bloodDrop 5s ease-in-out infinite",animationDelay:"3s"}}/></svg>
<div style={{fontSize:26,fontWeight:800,color:"#fff",letterSpacing:0.6}}>Xandroid</div><div style={{fontSize:11,color:accentCol,marginTop:4,letterSpacing:2,textTransform:"uppercase",fontWeight:600}}>SCPe / PCDF</div>
</div>
<div style={{marginBottom:24}}><label style={{...lb,color:"rgba(255,255,255,0.85)",fontWeight:600}}>Matrícula</label><input autoComplete="off" autoCorrect="off" spellCheck={false} className="login-input-focus" style={{...inp,fontSize:16,background:"rgba(0,0,0,0.3)",color:"#fff",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"13px 14px"}} value={loginMat} onChange={e=>setLoginMat(e.target.value)} placeholder="Ex.: 000.000-0" onKeyDown={e=>{if(e.key==="Enter")doLogin();}} autoFocus/>{(()=>{const det=lookupPerito(loginMat);if(det)return <div style={{marginTop:10,padding:"10px 12px",background:"rgba(52,199,89,0.12)",border:"1px solid rgba(52,199,89,0.35)",borderRadius:10,fontSize:13,color:"#fff",display:"flex",alignItems:"center",gap:6}}><AppIcon name="👤" size={16} mr={0}/><b>{det}</b></div>;if(loginMat&&loginMat.trim().length>=3)return <div style={{marginTop:10,padding:"10px 12px",background:"rgba(255,204,0,0.1)",border:"1px solid rgba(255,204,0,0.35)",borderRadius:10,fontSize:12,color:"rgba(255,255,255,0.8)",lineHeight:1.5,display:"flex",alignItems:"flex-start",gap:6}}><AppIcon name="⚠" size={14} mr={0}/><span>Matrícula não cadastrada. Você poderá preencher seu nome no campo "Perito 1" da Solicitação.</span></div>;return null;})()}</div>
<button type="button" className="login-btn-sheen" style={{...bt,background:btnGrad,color:"#fff",width:"100%",textAlign:"center",padding:"15px",fontSize:16,fontWeight:700,borderRadius:12,border:"none",boxShadow:btnShadow,cursor:"pointer",letterSpacing:0.3}} onClick={doLogin}>Entrar</button>
<p style={{fontSize:11,color:"rgba(255,255,255,0.5)",textAlign:"center",marginTop:18,lineHeight:1.7,display:"flex",alignItems:"center",justifyContent:"center",flexWrap:"wrap",gap:5}}><AppIcon name="💾" size={14} mr={0}/>Seus dados ficam salvos automaticamente<br/>vinculados à sua matrícula</p>
{/* v234: versão discreta no rodapé do login */}
<p style={{fontSize:10,color:"rgba(255,255,255,0.28)",textAlign:"center",marginTop:14,letterSpacing:0.3,fontVariantNumeric:"tabular-nums"}}>{APP_VERSION}</p>
</div></div>);}

return(<><style dangerouslySetInnerHTML={{__html:`html,body{overflow-x:hidden!important;max-width:100vw;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-feature-settings:"kern" 1,"liga" 1,"calt" 1,"ss01" 1;padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
*::-webkit-scrollbar{width:0;height:0}
button,label,[role=button]{transition:transform 0.15s cubic-bezier(0.34,1.56,0.64,1),opacity 0.12s ease,box-shadow 0.2s ease!important;-webkit-tap-highlight-color:transparent}
button:active,label:active,[role=button]:active{transform:scale(0.96)!important;opacity:0.92!important;transition:transform 0.08s ease-out,opacity 0.08s ease-out!important}
/* iOS Safari/Chrome iOS: força fonte mínima de 16px em campos editáveis para nunca disparar auto-zoom ao focar.
   Aplica só em telas pequenas (mobile/tablet) para não afetar desktop. */
@media (max-width:1024px){
  input:not([type=checkbox]):not([type=radio]):not([type=range]),select,textarea{font-size:16px!important}
}
/* iOS Typography Hierarchy — só classes em uso ativo */
.ios-mono{font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
/* Glass effect (iOS / iPadOS Tab Bar / Sheet) */
.ios-glass{backdrop-filter:saturate(180%) blur(20px);-webkit-backdrop-filter:saturate(180%) blur(20px)}
.ios-glass-light{background:rgba(255,255,255,0.78)!important}
.ios-glass-dark{background:rgba(12,12,14,0.82)!important;box-shadow:0 1px 0 rgba(255,255,255,0.04) inset}
/* Dynamic Island animations */
@keyframes diExpand{from{transform:translate(-50%,-100%) scale(0.6);opacity:0;border-radius:24px}50%{transform:translate(-50%,8px) scale(1.05);opacity:1}to{transform:translate(-50%,8px) scale(1);opacity:1;border-radius:24px}}
@keyframes diMorph{0%{transform:translate(-50%,8px) scale(1)}50%{transform:translate(-50%,8px) scale(1.04)}100%{transform:translate(-50%,8px) scale(1)}}
.di-toast{animation:diExpand 0.45s cubic-bezier(0.34,1.56,0.64,1) both}
.di-toast.morph{animation:diMorph 0.3s ease both}
/* Card hover/tap feedback */
.ios-card{transition:transform 0.2s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.2s ease}
@media(hover:hover){.ios-card:hover{transform:translateY(-2px)}}
/* Status pill (segmented dot indicators) */
.ios-statusPill{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:100px;font-size:11px;font-weight:600;letter-spacing:-0.1px;font-variant-numeric:tabular-nums}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes tabIconBounce{0%{transform:scale(0.6) rotate(-8deg)}50%{transform:scale(1.18) rotate(4deg)}100%{transform:scale(1) rotate(0)}}
@keyframes tabIconPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@keyframes snPickPop{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}
body.accent-pink .app-icon-svg{filter:hue-rotate(125deg) saturate(1.25) drop-shadow(0 1px 2px rgba(0,0,0,0.25)) drop-shadow(0 0.5px 1px rgba(0,0,0,0.15)) !important;}
@keyframes tabSlideInR{from{opacity:0.6}to{opacity:1}}
@keyframes tabSlideInL{from{opacity:0.6}to{opacity:1}}
@keyframes tabIndicatorSlide{from{transform:scaleX(0);opacity:0}to{transform:scaleX(1);opacity:1}}
@keyframes modalPop{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
@keyframes backdropIn{from{opacity:0}to{opacity:1}}

.tabSlideR{animation:tabSlideInR 0.18s ease-out forwards}
.tabSlideL{animation:tabSlideInL 0.18s ease-out forwards}

.modal-overlay{animation:backdropIn 0.25s ease both}
.modal-box{animation:modalPop 0.3s cubic-bezier(0.2,0,0,1) both}
details>summary{transition:color 0.2s ease}
details[open]>:not(summary){animation:fadeUp 0.25s cubic-bezier(0.2,0,0,1) both}
@keyframes savePulse{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
.save-pulse{animation:savePulse 0.4s cubic-bezier(0.2,0,0,1)}
/* v242: banner sticky em vermelho pulsando quando fotos não salvaram */
@keyframes stuckPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,59,48,0.7)}50%{box-shadow:0 0 0 8px rgba(255,59,48,0)}}
.photo-stuck-banner{animation:stuckPulse 1.6s ease-in-out infinite}
@supports(padding-bottom:env(safe-area-inset-bottom)){
input:focus-visible,textarea:focus-visible,select:focus-visible{box-shadow:0 0 0 3px rgba(0,122,255,0.35)!important;border-color:#007aff!important;}
.tab-content-wrap{padding-bottom:calc(120px + env(safe-area-inset-bottom))!important}}
/* v240: 100dvh corrige altura quebrada no iOS Safari quando barra do navegador aparece/some */
@supports(height:100dvh){html,body{min-height:100dvh}#root{min-height:100dvh}}
/* v240: home indicator e bordas laterais — garante respiro quando modal toma tela inteira */
.safe-bottom{padding-bottom:max(env(safe-area-inset-bottom),16px)!important}
.safe-top{padding-top:max(env(safe-area-inset-top),16px)!important}
/* v240: foco visível acessível em qualquer botão (a11y) */
button:focus-visible,[role=button]:focus-visible,a:focus-visible{outline:2px solid #0a84ff;outline-offset:2px;border-radius:6px}
`}}/><div style={{fontFamily:"-apple-system,'SF Pro Display','Helvetica Neue',sans-serif",background:t.bg,color:t.tx,minHeight:"100vh",width:"100%"}}><div id="topBar" className={`ios-glass ${dark?"ios-glass-dark":"ios-glass-light"}`} style={{borderBottom:`0.5px solid ${dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}`,padding:"6px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:1002,minHeight:42,boxSizing:"border-box",position:"fixed",top:0,left:0,right:0,WebkitTransform:"translateZ(0)",transform:"translateZ(0)",WebkitBackfaceVisibility:"hidden",willChange:"transform",paddingTop:"calc(env(safe-area-inset-top) + 8px)"}}><div style={{display:"flex",alignItems:"center",gap:8,minWidth:0,flex:1,overflow:"hidden"}}>{/* Identity badge */}<div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 9px 4px 5px",borderRadius:100,background:dark?"rgba(10,132,255,0.18)":"rgba(0,122,255,0.10)",flexShrink:0,border:dark?"1px solid rgba(90,200,250,0.15)":"1px solid rgba(0,122,255,0.12)"}}><svg viewBox="0 0 100 100" width="16" height="16" style={{flexShrink:0,filter:"drop-shadow(0 0 3px rgba(90,200,250,0.4))"}}><defs><radialGradient id="hdSkBg" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a4a7a"/><stop offset="100%" stopColor="#0a2540"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#hdSkBg)"/><path d="M50 22 C36 22 26 32 26 47 C26 57 31 64 38 68 L38 76 Q38 80 42 80 L44 80 L44 78 C44 76 45 75 47 75 C49 75 50 76 50 78 L50 80 L56 80 L56 78 C56 76 57 75 59 75 C61 75 62 76 62 78 L62 80 L64 80 Q68 80 68 76 L68 68 C75 64 80 57 80 47 C80 32 70 22 56 22 Z" fill="#f8f8fa" stroke="#a1a1a6" strokeWidth="1"/><ellipse cx="41" cy="48" rx="6" ry="7" fill="#0a2540"/><ellipse cx="61" cy="48" rx="6" ry="7" fill="#0a2540"/><circle cx="39" cy="45" r="1.4" fill="#5ac8fa"/><circle cx="59" cy="45" r="1.4" fill="#5ac8fa"/><path d="M51 56 L48 64 L51 66 L54 64 Z" fill="#0a2540"/></svg><span style={{color:t.ac,fontSize:11,fontWeight:700,letterSpacing:0.2,lineHeight:1}}>SCPe</span></div>{/* Ocorrência (foco principal) */}{data.oc?<div style={{display:"flex",flexDirection:"column",minWidth:0,flex:1,overflow:"hidden",lineHeight:1.1}}><span className="ios-mono" style={{fontSize:13,fontWeight:700,color:t.tx,letterSpacing:-0.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Oc. {data.oc}/{(data.oc_ano||"").slice(-2)} · {data.dp||"—"}</span>{data.p1&&<span style={{fontSize:10,color:t.t3,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginTop:1}}>{data.p1}</span>}</div>:<span style={{fontSize:13,color:t.t3,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1}}>Sem ocorrência ativa</span>}{/* Status pill compacta */}{(()=>{const isOK=saveState==="saved";const isSaving=saveState==="saving";const isErr=saveState==="error";const isDirty=saveState==="dirty";const dotColor=isOK?t.ok:(isSaving?"#ff9500":(isErr?t.no:"#ffcc00"));const label=isOK?"Salvo":(isSaving?"Salvando":(isErr?"Erro":"•••"));return(<div title={backupStatus||"Auto-save"} className="ios-statusPill" style={{background:dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)",color:t.t2,flexShrink:0}}><span style={{width:7,height:7,borderRadius:"50%",background:dotColor,boxShadow:isDirty||isSaving?`0 0 0 3px ${dotColor}33`:"none",flexShrink:0,transition:"box-shadow 0.3s"}}/>{label}</div>);})()}{!isOnline&&<div title="Sem internet" aria-label="Sem internet" className="ios-statusPill" style={{background:dark?"rgba(255,69,58,0.15)":"rgba(255,59,48,0.10)",color:t.no,flexShrink:0}}><span style={{fontSize:9}}>⚠</span>Offline</div>}</div><div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
{/* v247: cronômetro de cena — começa a contar quando dt_che é preenchido,
  para quando dt_ter é preenchido. Útil pro perito controlar tempo na cena. */}
{(()=>{const cheStr=data.dt_che;if(!cheStr)return null;const cheDt=parseFmtDt(cheStr);if(!cheDt)return null;const terDt=parseFmtDt(data.dt_ter);const refMs=terDt?terDt.getTime():Date.now();const elapsed=refMs-cheDt.getTime();if(elapsed<0)return null;void clockTick;/* força re-render no tick */
const dur=fmtDur(elapsed);const long=elapsed>3*60*60*1000;/* >3h destaca */
return(<div title={terDt?`Cena finalizada — duração total ${dur}`:`Tempo na cena (desde a chegada)`} aria-label={`Tempo na cena: ${dur}`} className="ios-statusPill" style={{background:terDt?(dark?"rgba(48,209,88,0.15)":"rgba(52,199,89,0.10)"):(long?(dark?"rgba(255,149,0,0.18)":"rgba(255,149,0,0.10)"):(dark?"rgba(10,132,255,0.18)":"rgba(0,122,255,0.10)")),color:terDt?t.ok:(long?"#ff9500":t.ac),flexShrink:0,fontVariantNumeric:"tabular-nums",fontWeight:700}}><span style={{fontSize:9}}>{terDt?"✓":"⏱"}</span>{dur}</div>);})()}
<button type="button" aria-label="Iniciar novo croqui" title="Novo croqui" style={{background:t.bg3,border:`1px solid ${t.bd}`,borderRadius:8,padding:"6px 8px",cursor:"pointer",color:t.t2,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",minWidth:32,minHeight:32}} onClick={()=>setShowConfirmNovo(true)}><Plus size={16} strokeWidth={2.4}/></button>
{(()=>{// v247: medidor de storage só (toggle de alta qualidade removido)
const totalKB=fotos.reduce((s,f)=>s+(f.sizeKB||0),0);const limitKB=quotaKB;
const pct=Math.min(100,Math.round(totalKB/limitKB*100));
const warn=pct>=70;const danger=pct>=90;
const color=danger?t.no:(warn?"#ff9500":t.ok);
if(fotos.length===0)return null;
return(<div title={`Armazenamento: ${(totalKB/1024).toFixed(1)} MB de ${quotaKB>=1048576?(quotaKB/1048576).toFixed(1)+" GB":(quotaKB/1024).toFixed(0)+" MB"} (${pct}%) · ${fotos.length} foto${fotos.length>1?"s":""}`} aria-label={`Armazenamento ${pct} por cento`} style={{background:t.bg3,border:`1px solid ${t.bd}`,borderRadius:8,padding:"6px 9px",color:t.tx,display:"flex",alignItems:"center",gap:4,fontFamily:"inherit",fontSize:11,fontWeight:600}}><Camera size={14}/><span style={{fontSize:10,color,fontWeight:700,background:warn?(dark?"#3a2a0a":"#fff4e0"):(dark?"#1a2a1a":"#e8f5e9"),padding:"1px 5px",borderRadius:4,lineHeight:1.2}}>{pct}%</span></div>);})()}
<button type="button" style={{background:accent==="pink"?"rgba(232,91,138,0.18)":"rgba(10,132,255,0.18)",border:`1px solid ${accent==="pink"?"#e85b8a":"#0a84ff"}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",color:accent==="pink"?"#e85b8a":"#0a84ff",display:"flex",alignItems:"center",gap:4,fontSize:12,fontFamily:"inherit",fontWeight:700,transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)"}} onClick={()=>{setAccent(accent==="pink"?"blue":"pink");haptic("selection");showToast(accent==="pink"?"💙 Tema azul":"💗 Tema rosa");}} title={accent==="pink"?"Mudar para azul":"Mudar para rosa"} aria-label="Alternar cor do tema">{accent==="pink"?"💗":"💙"}</button>
<button type="button" style={{background:t.bg3,border:`1px solid ${t.bd}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",color:t.tx,display:"flex",alignItems:"center",gap:4,fontSize:12,fontFamily:"inherit"}} onClick={()=>setDark(!dark)}>{dark?<Sun size={14}/>:<Moon size={14}/>}</button>
</div></div>{showStartMenu&&<div role="dialog" aria-modal="true" className="modal-overlay" style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:2000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"max(20px,env(safe-area-inset-top)) 16px 16px"}}><div className="modal-box" style={{background:t.cd,borderRadius:16,padding:24,maxWidth:440,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.4)",marginTop:20}}>
<div style={{textAlign:"center",marginBottom:16}}>{(()=>{const isPink=accent==="pink";const sb1=isPink?"#7a1a4a":"#1a4a7a";const sb2=isPink?"#40051f":"#0a2540";const aCol=isPink?"#ff6b9d":"#5ac8fa";return(<svg viewBox="0 0 200 200" style={{width:64,height:64,display:"block",margin:"0 auto",filter:`drop-shadow(0 0 8px ${isPink?"rgba(255,107,157,0.25)":"rgba(90,200,250,0.25)"})`}}><defs><radialGradient id="smLogoBg" cx="50%" cy="40%"><stop offset="0%" stopColor={sb1}/><stop offset="100%" stopColor={sb2}/></radialGradient><linearGradient id="smLogoSk" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#f8f8fa"/><stop offset="100%" stopColor="#d1d1d6"/></linearGradient><linearGradient id="smBloodG" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#8b0000"/><stop offset="100%" stopColor="#5a0000"/></linearGradient></defs><circle cx="100" cy="100" r="98" fill="url(#smLogoBg)"/><path d="M100 40 C70 40 48 62 48 95 C48 115 56 130 70 138 L70 155 Q70 162 78 162 L82 162 L82 158 C82 154 85 152 88 152 C91 152 94 154 94 158 L94 162 L106 162 L106 158 C106 154 109 152 112 152 C115 152 118 154 118 158 L118 162 L122 162 Q130 162 130 155 L130 138 C144 130 152 115 152 95 C152 62 130 40 100 40 Z" fill="url(#smLogoSk)" stroke="#a1a1a6" strokeWidth="1.5"/><ellipse cx="78" cy="98" rx="14" ry="16" fill={sb2}/><ellipse cx="122" cy="98" rx="14" ry="16" fill={sb2}/><circle cx="74" cy="93" r="2.5" fill={aCol}/><circle cx="118" cy="93" r="2.5" fill={aCol}/><path d="M100 115 L94 130 L100 134 L106 130 Z" fill={sb2}/><path d="M82 148 L82 156 M88 148 L88 156 M94 148 L94 156 M100 148 L100 156 M106 148 L106 156 M112 148 L112 156 M118 148 L118 156" stroke="#a1a1a6" strokeWidth="0.6" opacity="0.4"/><path d="M81 113 Q78 121 81 126 Q84 121 81 113 Z" fill="url(#smBloodG)"/></svg>);})()}<div style={{fontSize:20,fontWeight:800,color:t.tx,marginTop:4,letterSpacing:0.5}}>Xandroid</div><p style={{fontSize:12,color:t.t2,margin:"6px 0 0"}}>Olá, {loginName}! O que deseja fazer?</p></div>
<button type="button" style={{...bt,background:"#28a745",color:"#fff",width:"100%",textAlign:"center",padding:"14px",fontSize:15,marginBottom:8}} onClick={()=>{const emptySlot=savedSlots.length<5?[0,1,2,3,4].find(i=>!savedSlots.some(s=>s.slot===i)):0;setSlotIdx(emptySlot||0);setShowStartMenu(false);setBackupStatus("🆕 Novo croqui");setData(prev=>({...prev,oc_ano:prev.oc_ano||""+new Date().getFullYear()}));showToast("✅ Novo croqui no Slot "+(((emptySlot||0))+1));setTimeout(()=>setShowTemplatePicker(true),300);}}><AppIcon name="📝" size={14} mr={4}/>Novo Croqui</button>
{(data.p1||data.dp||vestigios.some(v=>v.desc))&&<button type="button" style={{...bt,background:dark?"rgba(10,132,255,0.15)":"rgba(0,122,255,0.08)",color:t.ac,border:`1.5px solid ${t.ac}55`,width:"100%",textAlign:"center",padding:"12px",fontSize:13,marginBottom:8}} onClick={()=>{setShowStartMenu(false);setTimeout(()=>setShowSaveTemplate(true),200);}}><AppIcon name="💾" size={14} mr={4}/>Salvar este croqui como template</button>}
<button type="button" style={{...bt,background:t.ac,color:"#fff",width:"100%",textAlign:"center",padding:"12px",fontSize:14,marginBottom:16}} onClick={()=>pickFile({accept:".json,.zip",onPick:(fls)=>doImportBackupFile(fls[0],()=>{setSlotIdx(0);setShowStartMenu(false);})})}><AppIcon name="📂" size={14} mr={4}/>Importar backup (JSON ou ZIP)</button>
{savedSlots.length>0&&<><div style={{fontSize:13,fontWeight:600,color:t.tx,marginBottom:8}}>📂 Croquis salvos ({savedSlots.length})</div>
{savedSlots.map(({slot,bd})=>{const dd=bd.data||bd.dados||{};const ageMs=bd.timestamp?Date.now()-new Date(bd.timestamp).getTime():0;const remainH=Math.max(0,Math.round((BACKUP_EXPIRY_MS-ageMs)/3600000));// v205: miniatura do desenho
const thumb=(()=>{if(!bd.desenho)return null;if(typeof bd.desenho==="string")return bd.desenho;if(typeof bd.desenho==="object"){const k=Object.keys(bd.desenho)[0];return bd.desenho[k]||null;}return null;})();
return(<div key={slot} style={{background:dark?"#1c2a1c":"#f0faf0",border:`2px solid ${dark?"#2a4a2a":"#a5d6a7"}`,borderRadius:12,padding:14,marginBottom:8,cursor:"pointer",display:"flex",gap:12}} onClick={()=>{applyBackupData({...bd,data:dd});setSlotIdx(slot);setShowStartMenu(false);setBackupStatus("✓ Slot "+(slot+1)+" restaurado");showToast("✅ Croqui carregado do Slot "+(slot+1));}}>{/* Miniatura */}<div style={{flexShrink:0,width:72,height:54,borderRadius:8,background:dark?"#0a0a0a":"#fff",border:`1px solid ${dark?"#2a4a2a":"#a5d6a7"}`,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>{thumb?<img src={thumb} alt="Miniatura" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}} loading="lazy"/>:<span style={{fontSize:22,opacity:0.3}}>📋</span>}{bd.fotos&&bd.fotos.length>0&&<span style={{position:"absolute",bottom:1,right:2,fontSize:8,fontWeight:700,background:"rgba(0,122,255,0.9)",color:"#fff",padding:"1px 4px",borderRadius:6,lineHeight:1}}>📷{bd.fotos.length}</span>}</div><div style={{flex:1,minWidth:0}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:11,fontWeight:700,color:"#28a745",background:dark?"#0a1a0a":"#d4edda",padding:"2px 8px",borderRadius:8}}>Slot {slot+1}</span><span style={{fontSize:10,color:remainH<6?t.no:t.t3}}>{bd.timestamp?fmtDt(bd.timestamp):""}{remainH>0?" ("+remainH+"h restantes)":""}</span></div>
{dd.oc&&<div style={{fontSize:14,fontWeight:700,color:t.ac}}>Oc. {dd.oc}{dd.oc_ano?"/"+dd.oc_ano:""} {dd.dp?"— "+dd.dp:""}</div>}
{dd.nat&&<div style={{fontSize:12,color:t.t2}}>{dd.nat==="Outros"&&dd.nat_outro?dd.nat_outro:dd.nat}</div>}
{dd.end&&<div style={{fontSize:11,color:t.t3,marginTop:2}}>📍 {dd.end}</div>}
{!dd.oc&&<div style={{fontSize:12,color:t.t3,fontStyle:"italic"}}>Croqui sem ocorrência</div>}
</div></div>);})}
</>}
{savedSlots.length===0&&<p style={{fontSize:12,color:t.t3,textAlign:"center",fontStyle:"italic"}}>Nenhum croqui salvo encontrado.</p>}
</div></div>}
{burstCtx&&<BurstModal rk={burstCtx.rk} fotoHQ={fotoHQ} onClose={()=>setBurstCtx(null)} onConfirm={(novas)=>{setFotos(p=>[...p,...novas]);haptic("heavy");showToast("📷 "+novas.length+" foto"+(novas.length>1?"s":"")+" adicionada"+(novas.length>1?"s":""));setBurstCtx(null);}} utils={{uid,mkAutoLegend,captureGPS,haptic}}/>}
{zipProgress&&(()=>{const isErr=zipProgress.error;const pct=Math.max(0,Math.min(100,zipProgress.pct||0));const isCancelado=zipProgress.stage==="Cancelado";const isDone=zipProgress.stage==="Concluído"||isCancelado;const startTime=zipProgress.startTime;const elapsed=startTime?Math.floor(((zipNowTick||Date.now())-startTime)/1000):0;const min=Math.floor(elapsed/60);const sec=elapsed%60;const elapsedTxt=`${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;return(<div role="dialog" aria-modal="true" className="modal-overlay" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)"}}><div style={{background:t.cd,borderRadius:18,padding:28,maxWidth:440,width:"100%",boxShadow:"0 12px 48px rgba(0,0,0,0.4)",border:`1.5px solid ${isErr?t.no:isCancelado?t.wn:t.ac}`}}><div style={{textAlign:"center",marginBottom:18}}><div style={{fontSize:48,marginBottom:8}}>{isErr?"❌":isCancelado?"⏹️":isDone?"✅":"📦"}</div><div style={{fontSize:18,fontWeight:800,color:isErr?t.no:isCancelado?t.wn:t.tx,letterSpacing:-0.3,marginBottom:4}}>{isErr?"Erro ao gerar ZIP":isCancelado?"Cancelado":isDone?"Pronto!":"Gerando pacote ZIP"}</div><div style={{fontSize:13,color:t.t2,marginBottom:2}}>{zipProgress.stage}</div>{zipProgress.detail&&<div style={{fontSize:11,color:t.t3,fontFamily:"monospace"}}>{zipProgress.detail}</div>}{startTime&&!isErr&&<div style={{fontSize:13,fontWeight:700,color:t.ac,fontFamily:"monospace",fontVariantNumeric:"tabular-nums",marginTop:8}}>⏱ {elapsedTxt}</div>}</div>{!isErr&&!isCancelado&&<><div style={{height:14,background:t.bg3,borderRadius:10,overflow:"hidden",marginBottom:8,border:`1px solid ${t.bd}`}}><div style={{height:"100%",width:pct+"%",background:`linear-gradient(90deg,${t.ac} 0%,${t.ac}dd 100%)`,transition:"width 0.4s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:`0 0 8px ${t.ac}88`}}/></div><div style={{textAlign:"center",fontSize:13,fontWeight:700,color:t.ac,fontVariantNumeric:"tabular-nums"}}>{pct}%</div></>}{!isDone&&!isErr&&<><div style={{textAlign:"center",fontSize:11,color:t.t3,marginTop:14,lineHeight:1.5}}>Aguarde — pode levar de 10 segundos a 2 minutos<br/>dependendo do tamanho dos arquivos.<br/><b>Não feche o app durante a geração.</b></div><button type="button" style={{...bt,background:"transparent",color:t.no,border:`1.5px solid ${t.no}`,width:"100%",textAlign:"center",marginTop:14,fontWeight:600}} onClick={()=>{zipCancelRef.current=true;showToast("⏹️ Cancelando…");}}><AppIcon name="⏹️" size={14} mr={4}/>Cancelar</button></>}{(isErr||isCancelado)&&<button type="button" style={{...bt,background:t.ac,color:"#fff",width:"100%",textAlign:"center",marginTop:12}} onClick={()=>setZipProgress(null)}>Fechar</button>}</div></div>);})()}
{showDiag&&(()=>{const errs=(typeof window!=="undefined"&&window.__xandroidErrors)||[];const cacheKeys=(()=>{try{return Object.keys(localStorage).filter(k=>k.startsWith("cq_lib_"));}catch(_){return[];}})();const libs=[];try{libs.push("html2pdf:"+(typeof window.html2pdf==="function"?"OK (função)":typeof window.html2pdf==="object"?"⚠️ OBJECT (corrompido)":"não carregado"));}catch(_){}try{libs.push("JSZip:"+(typeof window.JSZip==="function"?"OK (função)":typeof window.JSZip==="object"?"⚠️ OBJECT (corrompido)":"não carregado"));}catch(_){}const fullText=`Xandroid Diagnóstico — ${new Date().toLocaleString("pt-BR")}\nVersão: ${APP_VERSION}\nUserAgent: ${navigator.userAgent}\nLibs: ${libs.join(" | ")}\nCache libs: ${cacheKeys.join(", ")||"(vazio)"}\n\n=== Últimos ${errs.length} erros ===\n${errs.map((e,i)=>`[${i+1}] ${e.t}\nTipo: ${e.type}\nMsg: ${e.msg}\nExtra: ${e.extra}\nStack: ${e.stack}\n`).join("\n---\n")||"Nenhum erro registrado."}`;return(<div role="dialog" aria-modal="true" className="modal-overlay" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:2500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div className="modal-box" style={{background:t.cd,borderRadius:14,padding:20,maxWidth:600,width:"100%",maxHeight:"85vh",display:"flex",flexDirection:"column",boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}}><div style={{fontSize:18,fontWeight:800,color:t.ac,marginBottom:6,display:"flex",alignItems:"center",gap:8}}><AppIcon name="🔍" size={20} mr={0}/>Diagnóstico</div><p style={{fontSize:11,color:t.t2,margin:"0 0 12px",lineHeight:1.4}}>Estado interno do app, bibliotecas carregadas, e últimos erros. Útil para reportar problemas.</p><div style={{flex:1,overflowY:"auto",background:t.bg3,padding:12,borderRadius:8,fontFamily:"monospace",fontSize:11,color:t.tx,whiteSpace:"pre-wrap",lineHeight:1.5}}>{fullText}</div><div style={{display:"flex",gap:8,marginTop:12}}><button type="button" style={{...bt,background:t.ac,color:"#fff",flex:1,textAlign:"center"}} onClick={()=>{const fb=()=>{const ta=document.createElement("textarea");ta.value=fullText;ta.style.cssText="position:fixed;left:-9999px";document.body.appendChild(ta);ta.select();try{document.execCommand("copy");showToast("✅ Diagnóstico copiado!");}catch(e){showToast("❌ Falha ao copiar");}document.body.removeChild(ta);};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(fullText).then(()=>showToast("✅ Diagnóstico copiado!")).catch(fb);}else{fb();}}}><AppIcon name="📋" size={14} mr={4}/>Copiar tudo</button><button type="button" style={{...bt,background:t.bg3,color:t.tx,border:`1px solid ${t.bd}`,flex:1,textAlign:"center"}} onClick={()=>setShowDiag(false)}>Fechar</button></div></div></div>);})()}
{toast&&(()=>{const isOK=toast.startsWith("✅")||toast.includes("Salvo")||toast.includes("Copiado");const isErr=toast.startsWith("❌")||toast.startsWith("⚠");const isCam=toast.startsWith("📷");const bg=isOK?"linear-gradient(180deg,#34c759,#28a745)":isErr?"linear-gradient(180deg,#ff453a,#d12822)":isCam?"linear-gradient(180deg,#ff9500,#cc7700)":"linear-gradient(180deg,#0a84ff,#0066cc)";return(<div className="di-toast" style={{position:"fixed",top:"calc(env(safe-area-inset-top) + 8px)",left:"50%",transform:"translateX(-50%)",background:bg,color:"#fff",padding:"10px 18px",borderRadius:24,fontSize:14,fontWeight:600,letterSpacing:-0.2,zIndex:9999,boxShadow:"0 8px 24px rgba(0,0,0,0.35),0 0 0 0.5px rgba(255,255,255,0.15) inset",maxWidth:"90vw",textAlign:"center",pointerEvents:"none",display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}><IconText text={toast} size={16}/></div>);})()}
{/* v242: banner sticky vermelho pulsando — fotos não salvaram, AVISO PESADO pra não fechar o app */}
{photoSaveStuck&&<div role="alert" aria-live="assertive" className="photo-stuck-banner" style={{position:"fixed",top:"calc(env(safe-area-inset-top) + 56px)",left:8,right:8,zIndex:9998,background:"linear-gradient(180deg,#ff3b30,#c0271e)",color:"#fff",padding:"12px 16px",borderRadius:14,fontSize:13,fontWeight:700,letterSpacing:-0.2,boxShadow:"0 4px 16px rgba(255,59,48,0.45),inset 0 1px 0 rgba(255,255,255,0.18)",display:"flex",alignItems:"center",gap:10,lineHeight:1.35}}><span style={{fontSize:22,flexShrink:0}}>🚨</span><span style={{flex:1,minWidth:0}}>FOTOS NÃO FORAM SALVAS — <b>NÃO feche o app.</b> Reta tentando ({backupStatus}).</span><button type="button" aria-label="Tentar salvar agora" onClick={()=>saveBackup()} style={{background:"rgba(255,255,255,0.22)",color:"#fff",border:"1px solid rgba(255,255,255,0.4)",borderRadius:8,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Tentar agora</button></div>}
{editFotoId&&(()=>{const efIdx=fotos.findIndex(f=>f.id===editFotoId);const ef=fotos[efIdx];if(!ef)return null;const goPrev=()=>{if(efIdx>0)setEditFotoId(fotos[efIdx-1].id);};const goNext=()=>{if(efIdx<fotos.length-1)setEditFotoId(fotos[efIdx+1].id);};return(<div key={editFotoId} className="modal-overlay" style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.8)",zIndex:2300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div className="modal-box" style={{background:t.cd,borderRadius:16,padding:20,maxWidth:420,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><button type="button" disabled={efIdx<=0} style={{background:"none",border:"none",fontSize:22,cursor:efIdx>0?"pointer":"default",opacity:efIdx>0?1:0.25,color:t.ac,padding:"4px 8px"}} onClick={goPrev}>◀</button><span style={{fontSize:12,fontWeight:600,color:t.t2}}>Foto {efIdx+1} / {fotos.length}</span><button type="button" disabled={efIdx>=fotos.length-1} style={{background:"none",border:"none",fontSize:22,cursor:efIdx<fotos.length-1?"pointer":"default",opacity:efIdx<fotos.length-1?1:0.25,color:t.ac,padding:"4px 8px"}} onClick={goNext}>▶</button></div>
<div style={{textAlign:"center",marginBottom:12}}><img src={ef.dataUrl} style={{maxWidth:"100%",maxHeight:200,borderRadius:10,border:`2px solid ${t.ac}`}}/><div style={{fontSize:10,color:t.t3,marginTop:4}}>{ef.w}×{ef.h} | {ef.sizeKB}KB | {ef.name||""}</div></div>
<div style={{marginBottom:10}}><label style={{...lb,fontSize:11}}>Descrição da foto</label><TX_ value={ef.desc||""} placeholder="Ex: Vista geral do local" inputStyle={inp} onCommit={(val)=>updateFoto(ef.id,"desc",val)}/></div>
<div style={{marginBottom:10}}><label style={{...lb,fontSize:11}}>Fase / Momento</label><div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:4}}>{["Antes da perícia","Durante a perícia","Após a perícia","Chegada","Isolamento"].map(fase=><button type="button" key={fase} style={{padding:"8px 12px",fontSize:11,borderRadius:18,minHeight:36,border:`1px solid ${ef.fase===fase?t.ac:t.bd}`,background:ef.fase===fase?"rgba(0,122,255,0.12)":"transparent",color:ef.fase===fase?t.ac:t.t2,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>{updateFoto(ef.id,"fase",ef.fase===fase?"":fase);}}>{fase}</button>)}</div></div>
<div style={{marginBottom:14}}><label style={{...lb,fontSize:11}}>Local / Referência</label><TX_ value={ef.local||""} placeholder="Ex: Sala, cozinha, via pública" inputStyle={inp} onCommit={(val)=>updateFoto(ef.id,"local",val)}/></div>
<div style={{display:"flex",gap:10}}><button type="button" style={{...bt,background:t.ac,color:"#fff",flex:1,textAlign:"center",padding:"12px"}} onClick={()=>setEditFotoId(null)}><AppIcon name="✓" size={14} mr={4}/>Pronto</button><button type="button" style={{...bt,background:t.no,color:"#fff",flex:0,padding:"12px 16px"}} onClick={()=>{setFotos(prev=>prev.filter(x=>x.id!==ef.id));setEditFotoId(null);}}>🗑️</button></div>
</div></div>);})()}
{showConfirmRecup&&recupData&&<div role="dialog" aria-modal="true" className="modal-overlay" style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:2100,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"12px 16px"}}><div className="modal-box" style={{background:t.cd,borderRadius:16,padding:24,maxWidth:400,width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}}><div style={{fontSize:16,fontWeight:700,color:t.tx,marginBottom:8}}>📂 Slot {(recupData._slotIdx!==null?recupData._slotIdx:slotIdx)+1}</div><p style={{fontSize:13,color:t.t2,marginBottom:4}}>Salvo em: {fmtDt(recupData.timestamp)}</p>{recupData.data?.oc&&<p style={{fontSize:13,fontWeight:600,color:t.ac,marginBottom:4}}>Oc.: {recupData.data.oc}/{recupData.data.oc_ano||""} {recupData.data.dp||""}</p>}{recupData.data?.nat&&<p style={{fontSize:12,color:t.t2,marginBottom:4}}>Natureza: {recupData.data.nat}</p>}<div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12,fontSize:11,color:t.t2}}>{recupData.vestigios&&<span>🧪 {recupData.vestigios.filter(v=>v.desc).length} vest.</span>}{recupData.fotos&&<span>📷 {recupData.fotos.length} fotos</span>}{recupData.data?.end&&<span>📍 {recupData.data.end.slice(0,30)}</span>}</div><p style={{fontSize:12,color:t.no,fontWeight:600,marginBottom:16}}>Isso substituirá todos os dados atuais.</p><div style={{display:"flex",gap:10}}><button type="button" style={{...bt,background:t.ac,color:"#fff",flex:1,textAlign:"center",padding:"14px"}} onClick={()=>{const bd=recupData;const si=bd._slotIdx!==null?bd._slotIdx:slotIdx;applyBackupData(bd);setSlotIdx(si);setShowConfirmRecup(false);setRecupData(null);showToast("✅ Slot "+(si+1)+" carregado!");}}><AppIcon name="✓" size={14} mr={4}/>Carregar</button><button type="button" style={{...bt,background:t.bg3,color:t.tx,border:`1px solid ${t.bd}`,flex:1,textAlign:"center",padding:"14px"}} onClick={()=>{setShowConfirmRecup(false);setRecupData(null);}}>Cancelar</button></div></div></div>}
{showConfirmNovo&&<div role="dialog" aria-modal="true" className="modal-overlay" style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:2100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div className="modal-box" style={{background:t.cd,borderRadius:16,padding:24,maxWidth:400,width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}}><div style={{fontSize:18,fontWeight:700,color:t.ac,marginBottom:12}}>🆕 Iniciar novo croqui?</div>{data.oc&&<p style={{fontSize:13,fontWeight:600,color:t.ac,marginBottom:4}}>Croqui atual: Oc. {data.oc}/{data.oc_ano||""} {data.dp||""}</p>}<p style={{fontSize:13,color:t.t2,marginBottom:16,lineHeight:1.6}}>{(()=>{const usedSlots=new Set(savedSlots.map(s=>s.slot));let nextEmpty=-1;for(let i=0;i<5;i++){if(!usedSlots.has(i)){nextEmpty=i;break;}}return nextEmpty>=0?<>O croqui atual será <b>preservado no Slot {slotIdx+1}</b>.<br/>Novo croqui abrirá no <b>Slot {nextEmpty+1}</b> (vazio).</>:<><b>Atenção:</b> todos os 5 slots estão ocupados. O croqui atual (Slot {slotIdx+1}) será <b>substituído</b>. Faça backup JSON antes!</>;})()}</p><div style={{display:"flex",gap:10}}><button type="button" style={{...bt,background:t.ac,color:"#fff",flex:1,textAlign:"center",padding:"14px"}} onClick={()=>resetAll(true)}>🆕 Iniciar novo</button><button type="button" style={{...bt,background:t.bg3,color:t.tx,border:`1px solid ${t.bd}`,flex:1,textAlign:"center",padding:"14px"}} onClick={()=>setShowConfirmNovo(false)}>Cancelar</button></div></div></div>}
{showConfirmDeleteAll&&<div role="dialog" aria-modal="true" className="modal-overlay" style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.8)",zIndex:2400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div className="modal-box" style={{background:t.cd,borderRadius:16,padding:24,maxWidth:420,width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,0.5)",border:`2px solid ${t.no}`}}><div style={{fontSize:20,fontWeight:800,color:t.no,marginBottom:8,display:"flex",alignItems:"center",gap:8}}><AppIcon name="🔥" size={22} mr={0}/>Apagar TODOS os slots</div><p style={{fontSize:13,color:t.tx,marginBottom:8,lineHeight:1.5}}>Você está prestes a apagar permanentemente <b>os 5 slots</b> da matrícula <b>{loginMat}</b>.</p><p style={{fontSize:12,color:t.t2,marginBottom:16,lineHeight:1.5}}>Todos os croquis salvos serão PERDIDOS. Esta ação não pode ser desfeita. Faça backup JSON antes se precisar de algo.</p><label style={{...lb,fontSize:12,fontWeight:700,color:t.no,display:"block",marginBottom:6}}>Para confirmar, digite <b>APAGAR</b> abaixo:</label><input autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false} value={deleteAllInput} onChange={e=>setDeleteAllInput(e.target.value)} placeholder="APAGAR" style={{...inp,width:"100%",fontSize:16,padding:"12px 14px",border:`2px solid ${deleteAllInput==="APAGAR"?t.no:t.bd}`,borderRadius:10,marginBottom:16,textAlign:"center",letterSpacing:2,fontWeight:700}}/><div style={{display:"flex",gap:10}}><button type="button" disabled={deleteAllInput!=="APAGAR"} style={{...bt,background:deleteAllInput==="APAGAR"?t.no:t.bg3,color:deleteAllInput==="APAGAR"?"#fff":t.t3,flex:1,textAlign:"center",padding:"14px",fontWeight:700,cursor:deleteAllInput==="APAGAR"?"pointer":"not-allowed",opacity:deleteAllInput==="APAGAR"?1:0.6}} onClick={async()=>{if(deleteAllInput!=="APAGAR")return;setShowConfirmDeleteAll(false);try{for(let i=0;i<5;i++){await deleteFullSlot("cq_"+loginMat+"_"+i);}setSavedSlots([]);setSlotIdx(0);resetAll(true);haptic("heavy");showToast("🗑️ Todos os slots apagados");}catch(e){showToast("❌ Erro: "+e.message);}finally{setDeleteAllInput("");}}}>🗑️ Apagar TUDO</button><button type="button" style={{...bt,background:t.bg3,color:t.tx,border:`1px solid ${t.bd}`,flex:1,textAlign:"center",padding:"14px"}} onClick={()=>{setShowConfirmDeleteAll(false);setDeleteAllInput("");}}>Cancelar</button></div></div></div>}
{confirmDel&&(()=>{const cd=confirmDel;const isDanger=cd.danger!==false;const okBg=isDanger?t.no:t.ac;const okIcon=cd.okIcon||(isDanger?"🗑️":"✓");const okLabel=cd.okLabel||(isDanger?"Remover":"Continuar");const cancelLabel=cd.cancelLabel||"Cancelar";const headerEmoji=isDanger?"🗑️":"⚠️";return(<div role="dialog" aria-modal="true" className="modal-overlay" style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:2300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div className="modal-box" style={{background:t.cd,borderRadius:16,padding:24,maxWidth:420,width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}><div style={{textAlign:"center",marginBottom:18}}><div style={{fontSize:36,marginBottom:8}}>{headerEmoji}</div><div style={{fontSize:16,fontWeight:700,color:t.tx,marginBottom:8}}>{cd.title}</div><p style={{fontSize:13,color:t.t2,margin:0,lineHeight:1.5,wordBreak:"break-word",whiteSpace:"pre-line"}}>{cd.msg}</p></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button type="button" style={{...bt,background:"transparent",border:`1.5px solid ${t.bd}`,color:t.tx,padding:"14px",fontSize:14}} onClick={()=>{const fn=cd.onNo;setConfirmDel(null);if(fn)fn();}}>{cancelLabel}</button><button type="button" style={{...bt,background:okBg,color:"#fff",border:"none",padding:"14px",fontSize:14,fontWeight:700}} onClick={cd.onYes}><AppIcon name={okIcon} size={14} mr={4}/>{okLabel}</button></div></div></div>);})()}
{confirmBack&&<div className="modal-overlay" onClick={()=>setConfirmBack(null)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:2300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div className="modal-box" onClick={e=>e.stopPropagation()} style={{background:t.cd,borderRadius:16,padding:24,maxWidth:380,width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}><div style={{textAlign:"center",marginBottom:18}}><div style={{fontSize:36,marginBottom:8}}>⚠️</div><div style={{fontSize:16,fontWeight:700,color:t.tx,marginBottom:8}}>Voltar e sair?</div><p style={{fontSize:13,color:t.t2,margin:0,lineHeight:1.5}}>Seus dados podem ser perdidos se você sair agora.<br/>O auto-save grava em até 30s, mas alterações muito recentes podem se perder.</p></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button type="button" style={{...bt,background:t.ac,color:"#fff",border:"none",padding:"14px",fontSize:14,fontWeight:700}} onClick={()=>setConfirmBack(null)}><AppIcon name="✓" size={14} mr={4}/>Continuar aqui</button><button type="button" style={{...bt,background:"transparent",border:`1.5px solid ${t.no}`,color:t.no,padding:"14px",fontSize:14}} onClick={()=>{const fn=confirmBack;setConfirmBack(null);if(fn.onYes)fn.onYes();}}>↩ Sair mesmo assim</button></div></div></div>}
{showCameraHelp&&<div className="modal-overlay" onClick={()=>setShowCameraHelp(false)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:2300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div className="modal-box" onClick={e=>e.stopPropagation()} style={{background:t.cd,borderRadius:16,padding:24,maxWidth:420,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}><div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:36,marginBottom:6}}>📷</div><div style={{fontSize:17,fontWeight:700,color:t.tx,marginBottom:6}}>A câmera não abriu?</div><p style={{fontSize:12,color:t.t2,margin:0,lineHeight:1.5}}>Se a câmera estiver bloqueada, libere a permissão pelo navegador.</p></div><div style={{background:t.bg3,borderRadius:10,padding:14,marginBottom:12}}><div style={{fontSize:13,fontWeight:700,color:t.ac,marginBottom:6}}><AppIcon name="📱" size={14} mr={4}/>iPhone / iPad (Safari)</div><p style={{fontSize:12,color:t.tx,margin:"0 0 4px",lineHeight:1.5}}>Ajustes → Safari → Câmera → <b>Perguntar</b> ou <b>Permitir</b></p></div><div style={{background:t.bg3,borderRadius:10,padding:14,marginBottom:12}}><div style={{fontSize:13,fontWeight:700,color:t.ac,marginBottom:6}}><AppIcon name="📱" size={14} mr={4}/>iPhone / iPad (Chrome)</div><p style={{fontSize:12,color:t.tx,margin:"0 0 4px",lineHeight:1.5}}>Ajustes → Chrome → Câmera → ativar</p></div><div style={{background:t.bg3,borderRadius:10,padding:14,marginBottom:12}}><div style={{fontSize:13,fontWeight:700,color:t.ac,marginBottom:6}}><AppIcon name="📱" size={14} mr={4}/>Android (Chrome)</div><p style={{fontSize:12,color:t.tx,margin:"0 0 4px",lineHeight:1.5}}>Toque no <b>cadeado 🔒</b> na barra de endereço → Permissões → Câmera → <b>Permitir</b></p></div><div style={{background:t.warningBg,border:`1px solid ${t.warningBd}`,borderRadius:10,padding:12,marginBottom:14}}><p style={{fontSize:11,color:t.tx,margin:0,lineHeight:1.5}}>💡 <b>Alternativa:</b> use o botão <b><AppIcon name="🖼️" size={14} mr={4}/>Galeria</b> ao lado da câmera para escolher uma foto já tirada.</p></div><button type="button" style={{...bt,background:t.ac,color:"#fff",width:"100%",textAlign:"center",padding:"12px",fontSize:14,fontWeight:700}} onClick={()=>{setShowCameraHelp(false);setCameraCancelCount(0);}}><AppIcon name="✓" size={14} mr={4}/>Entendi</button></div></div>}
{showTemplatePicker&&<div className="modal-overlay" onClick={()=>{setShowTemplatePicker(false);setPendingTemplateId(null);}} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:2100,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"max(20px,env(safe-area-inset-top)) 16px 16px"}}><div className="modal-box" onClick={e=>e.stopPropagation()} style={{background:t.cd,borderRadius:16,padding:24,maxWidth:460,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.3)",marginTop:20}}><div style={{fontSize:18,fontWeight:700,color:t.tx,marginBottom:6,display:"flex",alignItems:"center",gap:8}}><AppIcon name="📋" size={22} mr={0}/>Tipo de ocorrência</div><p style={{fontSize:12,color:t.t2,marginBottom:16,lineHeight:1.5}}>Etapa 1 de 2 — Escolha o tipo. Em seguida você indicará o local do fato. Campos serão pré-preenchidos e poderão ser ajustados.</p>{customTemplates.length>0&&<><div style={{fontSize:11,fontWeight:700,color:t.ac,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5,display:"flex",alignItems:"center",gap:4}}><AppIcon name="💾" size={12} mr={0}/>Meus templates</div><div style={{display:"grid",gap:8,marginBottom:14}}>{customTemplates.map(tpl=><div key={tpl.id} style={{display:"flex",alignItems:"stretch",gap:6}}><button type="button" onClick={()=>applyTemplate(tpl.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,background:dark?"rgba(10,132,255,0.08)":"rgba(0,122,255,0.05)",border:`1px solid ${t.ac}44`,cursor:"pointer",textAlign:"left",fontFamily:"inherit",color:t.tx,flex:1}}><AppIcon name={tpl.icon||"💾"} size={28} mr={0}/><span style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:600,marginBottom:2}}>{tpl.label}</div><div style={{fontSize:11,color:t.t2,lineHeight:1.4}}>{tpl.description}</div></span><span style={{fontSize:16,color:t.t3,flexShrink:0}}>›</span></button><button type="button" onClick={()=>{if(confirm(`Remover template "${tpl.label}"?`))deleteCustomTemplate(tpl.id);}} style={{background:"rgba(255,59,48,0.12)",border:`1.5px solid ${t.no}`,color:t.no,cursor:"pointer",fontSize:18,fontWeight:700,borderRadius:10,padding:"0 12px",minWidth:40,fontFamily:"inherit"}} title="Remover template" aria-label="Remover template">×</button></div>)}</div><div style={{fontSize:11,fontWeight:700,color:t.t2,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>Padrão</div></>}<div style={{display:"grid",gap:8,marginBottom:16}}>{TEMPLATES.map(tpl=><button type="button" key={tpl.id} onClick={()=>applyTemplate(tpl.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,background:t.bg3,border:`1px solid ${t.bd}`,cursor:"pointer",textAlign:"left",fontFamily:"inherit",color:t.tx,width:"100%"}}><span style={{display:"inline-flex",gap:2,alignItems:"center",flexShrink:0}}>{(()=>{try{const seg=new Intl.Segmenter("pt-BR",{granularity:"grapheme"});return[...seg.segment(tpl.icon||"")].map((s,i)=><AppIcon key={i} name={s.segment} size={28} mr={0}/>);}catch(e){return Array.from(tpl.icon||"").filter(c=>c!=="\uFE0F").map((c,i)=><AppIcon key={i} name={c} size={28} mr={0}/>);}})()}</span><span style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:600,marginBottom:2}}>{tpl.label}</div><div style={{fontSize:11,color:t.t2,lineHeight:1.4}}>{tpl.description}</div></span><span style={{fontSize:16,color:t.t3,flexShrink:0}}>›</span></button>)}</div><button type="button" onClick={()=>{setShowTemplatePicker(false);setPendingTemplateId(null);}} style={{width:"100%",padding:"12px",borderRadius:10,background:"transparent",color:t.t2,border:`1.5px dashed ${t.bd}`,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:500}}><AppIcon name="📄" size={14} mr={5}/>Começar em branco</button></div></div>}
{showSaveTemplate&&<div className="modal-overlay" onClick={()=>setShowSaveTemplate(false)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:2200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div className="modal-box" onClick={e=>e.stopPropagation()} style={{background:t.cd,borderRadius:16,padding:24,maxWidth:420,width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}><div style={{fontSize:18,fontWeight:700,color:t.tx,marginBottom:6,display:"flex",alignItems:"center",gap:8}}><AppIcon name="💾" size={22} mr={0}/>Salvar como template</div><p style={{fontSize:12,color:t.t2,marginBottom:16,lineHeight:1.5}}>Salva o Perito 1, tipo de ocorrência, vestígios e observações escritas. <b>Não</b> salva nº de ocorrência, Perito 2, DP, endereço/coordenadas, fotos nem feridas específicas.</p><div style={{marginBottom:14}}><label style={lb}>Nome do template *</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={inp} value={tplNameInput} onChange={e=>setTplNameInput(e.target.value)} placeholder="Ex.: Homicídio Plano Piloto" autoFocus maxLength={60}/></div><div style={{marginBottom:16}}><label style={lb}>Descrição (opcional)</label><input autoComplete="off" autoCorrect="off" spellCheck={false} style={inp} value={tplDescInput} onChange={e=>setTplDescInput(e.target.value)} placeholder="Ex.: Meu padrão para PAF em via pública" maxLength={100}/></div><div style={{display:"flex",gap:10}}><button type="button" style={{...bt,background:t.ac,color:"#fff",flex:1,textAlign:"center",padding:"12px"}} onClick={saveCustomTemplate}><AppIcon name="✓" size={14} mr={4}/>Salvar</button><button type="button" style={{...bt,background:t.bg3,color:t.tx,border:`1px solid ${t.bd}`,flex:1,textAlign:"center",padding:"12px"}} onClick={()=>{setShowSaveTemplate(false);setTplNameInput("");setTplDescInput("");}}><AppIcon name="✕" size={14} mr={4}/>Cancelar</button></div></div></div>}
{showLocalPicker&&pendingTemplateId&&<div className="modal-overlay" onClick={()=>applyTemplateAndLocal(null)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:2200,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"max(20px,env(safe-area-inset-top)) 16px 16px"}}><div className="modal-box" onClick={e=>e.stopPropagation()} style={{background:t.cd,borderRadius:16,padding:24,maxWidth:460,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.3)",marginTop:20}}><div style={{fontSize:18,fontWeight:700,color:t.tx,marginBottom:6,display:"flex",alignItems:"center",gap:8}}><AppIcon name="📍" size={22} mr={0}/>Local do fato</div>{(()=>{const tpl=TEMPLATES.find(t=>t.id===pendingTemplateId);return tpl?<p style={{fontSize:12,color:t.t2,marginBottom:16,lineHeight:1.5}}>Etapa 2 de 2 — <b style={{color:t.ac,display:"inline-flex",alignItems:"center",gap:4}}>{(()=>{try{const seg=new Intl.Segmenter("pt-BR",{granularity:"grapheme"});return[...seg.segment(tpl.icon||"")].map((s,i)=><AppIcon key={i} name={s.segment} size={16} mr={0}/>);}catch(e){return Array.from(tpl.icon||"").filter(c=>c!=="\uFE0F").map((c,i)=><AppIcon key={i} name={c} size={16} mr={0}/>);}})()} {tpl.label}</b><br/>Onde o fato ocorreu?</p>:null;})()}<div style={{display:"grid",gap:8,marginBottom:16}}>{LOCAIS.filter(loc=>!loc.hidden).map(loc=><button type="button" key={loc.id} onClick={()=>applyTemplateAndLocal(loc.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,background:t.bg3,border:`1px solid ${t.bd}`,cursor:"pointer",textAlign:"left",fontFamily:"inherit",color:t.tx,width:"100%"}}><span style={{display:"inline-flex",gap:2,alignItems:"center",flexShrink:0}}>{(()=>{try{const seg=new Intl.Segmenter("pt-BR",{granularity:"grapheme"});return[...seg.segment(loc.icon||"")].map((s,i)=><AppIcon key={i} name={s.segment} size={28} mr={0}/>);}catch(e){return Array.from(loc.icon||"").filter(c=>c!=="\uFE0F").map((c,i)=><AppIcon key={i} name={c} size={28} mr={0}/>);}})()}</span><span style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:600,marginBottom:2}}>{loc.label}</div><div style={{fontSize:11,color:t.t2,lineHeight:1.4}}>{loc.description}</div></span><span style={{fontSize:16,color:t.t3,flexShrink:0}}>›</span></button>)}</div><button type="button" onClick={()=>applyTemplateAndLocal(null)} style={{width:"100%",padding:"12px",borderRadius:10,background:"transparent",color:t.t2,border:`1.5px dashed ${t.bd}`,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:500}}>⏭️ Pular — sem pré-preencher local</button></div></div>}
<div style={{height:"calc(96px + env(safe-area-inset-top))"}}/><div ref={tabsBarRef} className={`ios-glass ${dark?"ios-glass-dark":"ios-glass-light"}`} style={{display:"flex",overflowX:"auto",borderBottom:`0.5px solid ${dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}`,scrollbarWidth:"none",zIndex:1001,position:"fixed",top:"calc(48px + env(safe-area-inset-top))",left:0,right:0,justifyContent:"safe center",WebkitTransform:"translateZ(0)",transform:"translateZ(0)",WebkitBackfaceVisibility:"hidden",willChange:"transform",padding:"4px 6px"}}>{tabs.map((x,i)=>{const active=i===tab;return(<button type="button" ref={active?activeTabRef:null} key={i} style={{position:"relative",padding:isLarge?"14px 24px":"10px 14px",fontSize:isLarge?17:13,fontWeight:active?700:500,color:active?t.ac:t.t2,background:active?(dark?"rgba(10,132,255,0.18)":"rgba(0,122,255,0.10)"):"transparent",border:"none",borderRadius:12,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",minHeight:isLarge?56:42,transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)",letterSpacing:-0.2,margin:"2px 1px"}} onClick={()=>{if(i===tab)return;haptic("selection");setTabDir(i>tab?"r":"l");setTab(i);scrollTop();}}><span style={{display:"inline-flex",alignItems:"center",filter:active?`drop-shadow(0 0 10px ${t.ac}aa) drop-shadow(0 0 18px ${t.ac}55)`:"none",transition:"filter 0.3s ease",animation:active?"tabIconBounce 0.5s cubic-bezier(0.34,1.56,0.64,1),tabIconPulse 2.4s ease-in-out 0.5s infinite":"none"}}><AppIcon name={x.i} size={isLarge?32:20} mr={isLarge?9:5}/></span>{x.l}{active&&<span style={{position:"absolute",bottom:2,left:"15%",right:"15%",height:4,borderRadius:3,background:`linear-gradient(90deg,${t.ac} 0%,${t.ac}cc 50%,${t.ac} 100%)`,boxShadow:`0 0 12px ${t.ac},0 0 4px ${t.ac}`,animation:"tabIndicatorSlide 0.4s cubic-bezier(0.34,1.56,0.64,1)"}}/>}{tabBadge(i)?<span style={{background:t.ac,color:"#fff",fontSize:10,fontWeight:700,borderRadius:8,padding:"1px 6px",marginLeft:5,minWidth:16,textAlign:"center",display:"inline-block",fontVariantNumeric:"tabular-nums"}}>{tabBadge(i)}</span>:tabHasData(i)?<span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:t.ok,marginLeft:5,verticalAlign:"middle"}}/>:null}{tabFotoCount(i)>0&&i!==TAB_EXPORTAR&&<span style={{background:"#ff9500",color:"#fff",fontSize:10,fontWeight:700,borderRadius:8,padding:"1px 6px",marginLeft:4,display:"inline-block",fontVariantNumeric:"tabular-nums"}}>📷{tabFotoCount(i)}</span>}</button>);})}
</div><div className={(tabDir==="r"?"tabSlideR":"tabSlideL")+(tab!==TAB_DESENHO?" tab-content-wrap":"")} onTouchStart={onSwipeStart} onTouchEnd={onSwipeEnd} style={{maxWidth:tab===TAB_DESENHO?1240:900,margin:"0 auto",padding:tab===TAB_DESENHO?"8px 8px 200px 8px":"16px 16px 120px 16px",paddingTop:28}}><TabErrorBoundary key={"eb-"+resetKey}>{renderTab()}</TabErrorBoundary></div></div></>);
}

import{C as n}from"./HardwareInstallation-4f848d8b.js";import{_ as s,u as a,k as i,l,D as p,N as c,x as e,y as r}from"./vendor-a21b3a62.js";import"./vendor-fortawesome-41164876.js";import"./index-7731ba98.js";import"./vendor-bootstrap-d0c3645c.js";import"./vendor-jquery-a5dbbab1.js";import"./vendor-axios-0e6de98a.js";import"./vendor-sortablejs-3016fed8.js";import"./dynamic-import-helper-be004503.js";const m={name:"DeviceSolarLogCounter",mixins:[n]},u={class:"device-solar_log-counter"};function d(_,o,g,h,f,b){const t=a("openwb-base-alert");return i(),l("div",u,[p(t,{subtype:"info"},{default:c(()=>o[0]||(o[0]=[e("span",{class:"text-danger"},[r(" Solar-Log Zähler geben keine Ströme aus, sodass nur ein Lastmanagement anhand der Gesamtleistung, aber nicht phasenbasiert möglich ist."),e("br")],-1),r(" Solar-Log Zähler sind Hausverbrauchs-Zähler. Um die Werte am EVU-Punkt zu ermitteln, muss ein virtueller Zähler konfiguriert werden. Eine Beispiel-Konfiguration mit Solar-Log Zähler findest Du im "),e("a",{href:"https://github.com/openWB/core/wiki/Hausverbrauchs-Z%C3%A4hler",target:"_blank",rel:"noopener noreferrer"}," Wiki für Hausverbrauchs-Zähler ",-1),r(". ")])),_:1})])}const N=s(m,[["render",d],["__file","/opt/openWB-dev/openwb-ui-settings/src/components/devices/solar_log/solar_log/counter.vue"]]);export{N as default};
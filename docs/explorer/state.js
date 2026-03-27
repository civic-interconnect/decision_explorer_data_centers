// docs/explorer/state.js

let state = { csv: '', toml: '' };
let selectedSite = null;
let selectedCsvRowIndex = 0;


// export const state = {
//   csvText: "",
//   tomlText: "",
//   sites: [],
//   selectedSiteId: null,
// };

// export function getSelectedSite() {
//   return state.sites.find((site) => site.site_id === state.selectedSiteId) || null;
// }

// export function setSelectedSite(siteId) {
//   state.selectedSiteId = siteId;
// }

// export function replaceSelectedSite(updatedSite) {
//   state.sites = state.sites.map((site) =>
//     site.site_id === updatedSite.site_id ? updatedSite : site
//   );
// }

export function renderSiteForm() {
  const form = document.getElementById("site-form");
  const site = getSelectedSite();

  if (!site) {
    form.innerHTML = '<p class="empty-msg">No site selected.</p>';
    return;
  }

  form.innerHTML = `
    <div class="form-grid">
      <label>
        <span>Site ID</span>
        <input type="text" name="site_id" value="${escapeHtml(site.site_id)}">
      </label>

      <label>
        <span>Site Name</span>
        <input type="text" name="site_name" value="${escapeHtml(site.site_name)}">
      </label>

      <label>
        <span>County</span>
        <input type="text" name="county" value="${escapeHtml(site.county)}">
      </label>

      <label>
        <span>Zoning</span>
        <select name="zoning">
          ${renderZoningOptions(site.zoning)}
        </select>
      </label>

      <label>
        <span>Distance to residential (m)</span>
        <input type="number" step="0.1" name="distance_to_residential_m" value="${site.distance_to_residential_m}">
      </label>

      <label>
        <span>Interconnection years</span>
        <input type="number" step="0.1" name="interconnection_years" value="${site.interconnection_years}">
      </label>

      ${renderBooleanField("water_stressed_basin", "Water-stressed basin", site.water_stressed_basin)}
      ${renderBooleanField("drought_sustainable", "Drought sustainable", site.drought_sustainable)}
      ${renderBooleanField("substation_capacity_available", "Substation capacity available", site.substation_capacity_available)}
      ${renderBooleanField("requires_major_new_transmission", "Requires major new transmission", site.requires_major_new_transmission)}
      ${renderBooleanField("operator_pays_grid_upgrades", "Operator pays grid upgrades", site.operator_pays_grid_upgrades)}
      ${renderBooleanField("demand_response_capable", "Demand response capable", site.demand_response_capable)}
      ${renderBooleanField("continuous_noise_monitoring", "Continuous noise monitoring", site.continuous_noise_monitoring)}
    </div>
  `;

  form.oninput = handleSiteFormInput;
}

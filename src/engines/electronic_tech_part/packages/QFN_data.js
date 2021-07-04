export default {
  // name: '',
  // package: '',
  dimensions: {
    d_min_body_span: 3.85, //
    d_max_body_span: 4.15, //
    e_min_body_span: 3.85, //
    e_max_body_span: 4.15, //
    chamfered_corner: 0.0, //
    min_standoff: 0.01, //
    maximum_height: 0.8, //
    pin_location: 0 // 1 - center e
  },
  package_pin: {
    min_lead_width: 0.18, //
    max_lead_width: 0.3, //
    min_lead_range: 0.35, //
    max_lead_range: 0.75, //
    e_pitch: 0.5, //
    e1_pitch: 0.5, //
    min_lead_height: 0.2, //
    max_lead_height: 0.2, //
    e2_min_thermal_range: 3.85, //
    e2_max_thermal_range: 4.15, //
    d2_min_thermal_range: 2.1, //
    d2_max_thermal_range: 2.3, //
    e_number_pins: 3, //
    d_number_pins: 4 //
  },
  package_power_pins: {
    add_power_and_ground: false, //
    l2_width: 0, //
    b2_power_bar: 0, //
    b4_power_bar: 0, //
    b3_ground_bar: 0, //
    b5_ground_bar: 0, //
    g3_power_bar_spacing: 1.7, //
    g5_power_bar_spacing: 1.7, //
    g4_ground_bar_spacing: 0.7, //
    g6_ground_bar_spacing: 0.7 //
  },
  package_heel: {
    semin: 2.35, //
    semax: 2.99, //
    sdmin: 2.35, //
    sdmax: 2.99, //
    isCalculated: true //
  },
  solder_filters: {
    toe_filter: 0.3, //
    side_filter: 0.0,
    heel_filter: -0.04,
    board_density_level: 1, // medium, 0 - low, 2- height
    isDefault: true //
  },
  component_tolerances: {
    d_overall_width: 0.3, //
    e_overall_width: 0.3, //
    d_heel_distance: 0.64,
    e_heel_distance: 0.64,
    lead_width: 0.12, //
    isCalculated: true //
  },
  IPC_tolerances: {
    fabrication: 0.05,
    assembly: 0.05,
    courtyard: 0.25,
    isDefault: true
  },
  footprint_dimension: {
    x1: 0.25, //
    y1: 0.2, //
    x2: 4, //
    y2: 2.2, //
    c1: 4.55, //
    c2: 4.55, //
    pad_shape: 1, // 1 - rectangle
    isCalculated: true
  },
  silkscreen: {
    isCalculated: true, //
    LineWidth: 0.1, //
    r1: 4.45, //
    r2: 4.45 //
  },
  courtyard: {
    isCourtyardCalculated: false, //
    isAssemblyCalculated: true, //
    isCompBodyCalculated: true, //
    addCourtYardInfo: true, //
    addAssemblyInfo: true, //
    addCompBodyInfo: true, //
    courtV1: '5.25', //
    courtV1LineWidth: '0.05', //
    courtV2: '5.25', //
    courtV2layer: '14', //
    assemblyA: '4.15', //
    assemblyALineWidth: '0.1', //
    assemblyB: '4.15', //
    assemblyBlayer: '12', //
    addCompWidth: '4.15', //
    addCompLength: '4.15', //
    addCompLayer: '12' // layer 13, but index start from 0
  },
  footprint_description: {
    suggested: false, //
    suggestedName: '', //
    suggestedDesc: '' //
  }
}
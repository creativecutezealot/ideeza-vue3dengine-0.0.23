export default {
  // name: '',
  // package: '',
  dimensions: {
    e_min_lead_span: '16.95',
    e_max_lead_span: '17.45',
    d_min_lead_span: '22.95',
    d_max_lead_span: '23.45',
    min_standoff: '0.25',
    maximum_height: '2.45',
    pin_location: '0'
  },
  package_pin: {
    min_lead_width: '0.22',
    max_lead_width: '0.38',
    min_lead_length: '0.7',
    max_lead_length: '1.05', 
    min_body_width: '14',
    max_body_width: '14',
    min_body_length: '20',
    max_body_length: '20',
    e_number_pins: '20',
    d_number_pins: '30',
    pitch: '0.65'
  },
  package_thermal_pad: {
    addTermal: true,
    e2_min_thermal_range: '10',
    e2_max_thermal_range: '10',
    d2_min_thermal_range: '10',
    d2_max_thermal_range: '10'
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
    pad_shape: 0, // 1 - rectangle
    isCalculated: true
  },
  silkscreen: {
    isCalculated: true, //
    LineWidth: 0.1, //
    r1: 7, //
    r2: 7 //
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

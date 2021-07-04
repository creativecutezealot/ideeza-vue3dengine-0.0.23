export default {
  hasValue: false,
  value: '',
  package: 'TQFN',
  isClockwise: false,
  name: '',
  name2d: '',
  nameFontSize: 0,
  legs: 32,
  PinStartAt: 1,
  dimensions: {
    pinNumber: '32',
    d_min_lead_span: 0,
    d_max_lead_span: 7,
    e_min_lead_span: 0,
    e_max_lead_span: 7,
    min_standoff: '0.1',
    maximum_height: '0.8',
    pin_location: '0'
  },
  package_pin: {
    min_lead_width: '0',
    max_lead_width: '0.45', // 0.55
    min_lead_length: '0',
    max_lead_length: '1.17', // 1.27
    min_body_width: '14',
    max_body_width: '14',
    min_body_length: '20',
    max_body_length: '20',
    e_number_pins: '8',
    d_number_pins: '8',
    pitch: '0.8'
  },
  package_thermal_pad: {
    pin_location: true,
    e2_min_thermal_range: '',
    e2_max_thermal_range: '',
    d2_min_thermal_range: '',
    d2_max_thermal_range: ''
  },
  package_heel: {semin: '', semax: '', sdmin: '', sdmax: '', isCalculated: false},
  solder_filters: {toe_filter: '', side_filter: '', heel_filter: '', board_density_level: '', isDefault: false},
  component_tolerances: {d_overall_width: '', e_overall_width: '', d_heel_distance: '', e_heel_distance: '', lead_width: '', isCalculated: false},
  IPC_tolerances: {
    fabrication: '',
    assembly: '',
    courtyard: '',
    isDefault: false
  },
  footprint_dimension: {x: '', y: '', c1: '', c2: '', isCalculated: false},
  silkscreen: {
    isCalculated: true,
    LineWidth: '0.1',
    r1: '7',
    r2: '7'
  },
  courtyard: {
    isCourtyardCalculated: false,
    isAssemblyCalculated: false,
    isCompBodyCalculated: false,
    addCourtYardInfo: false,
    addAssemblyInfo: true,
    addCompBodyInfo: true,
    courtV1: '11.5',
    courtV1LineWidth: '0.5',
    courtV2: '11.5',
    courtV2layer: '1',
    assemblyA: '11.5',
    assemblyALineWidth: '0.5',
    assemblyB: '11.5',
    assemblyBlayer: '1',
    addCompWidth: '11.5',
    addCompLength: '0.5',
    addCompLayer: '12'
  },
  footprint_description: {
    suggested: false,
    suggestedName: '',
    suggestedDesc: ''
  }
}

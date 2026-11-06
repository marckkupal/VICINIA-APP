// Test-only stand-in for react-native-maps. Markers render as pressable elements so tests can tap them.
const React = require('react');
const { View, TouchableOpacity } = require('react-native-web');
const MapView = React.forwardRef(function MapView(props, ref) {
  React.useImperativeHandle(ref, () => ({ animateCamera: () => {} }));
  return React.createElement(View, { testID: 'map', accessibilityLabel: 'map', 'data-region': JSON.stringify(props.initialRegion) }, props.children);
});
const Marker = (p) => React.createElement(TouchableOpacity, { accessibilityLabel: 'marker: ' + (p.accessibilityLabel || p.title || ''), onPress: () => p.onPress && p.onPress({ stopPropagation() {} }) }, p.children);
const UrlTile = () => null;
module.exports = { __esModule: true, default: MapView, Marker, UrlTile };

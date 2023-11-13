import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Button,
  Animated,
  Alert,
  ScrollView,
  Modal,
  Text,
} from 'react-native';
import MapView, { MAP_TYPES, Marker, Circle } from 'react-native-maps';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { OPENROUTESERVICE_API_KEY } from './config';

const Map = () => {
  const [searchValue, setSearchValue] = useState('');
  const [mapRegion, setMapRegion] = useState(null);
  const mapViewRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapType, setMapType] = useState(MAP_TYPES.HYBRID);
  const locationUpdateSubscriptionRef = useRef(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);

  useEffect(() => {
    const loadUserLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      locationUpdateSubscriptionRef.current = Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High },
        (location) => {
          const { latitude, longitude } = location.coords;
          setUserLocation({ latitude, longitude });
          if (!mapRegion) {
            setMapRegion({
              latitude,
              longitude,
              latitudeDelta: 0.95,
              longitudeDelta: 0.95,
            });
          }
        }
      );

      return () => {
        if (locationUpdateSubscriptionRef.current) {
          locationUpdateSubscriptionRef.current.remove();
        }
      };
    };

    loadUserLocation();
  }, []);

  const handleZoomIn = () => {
    mapViewRef.current?.animateToRegion({
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
      latitudeDelta: mapRegion.latitudeDelta / 8,
      longitudeDelta: mapRegion.longitudeDelta / 8,
    });
  };

  const handleZoomOut = () => {
    mapViewRef.current?.animateToRegion({
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
      latitudeDelta: mapRegion.latitudeDelta * 8,
      longitudeDelta: mapRegion.longitudeDelta * 8,
    });
  };

  const handleClear = () => {
    setSearchValue('');
  };

  const handleMapTypeChange = (newMapType) => {
    setMapType(newMapType);
  };

  const handleSearch = async () => {
    if (searchValue) {
      try {
        const response = await axios.get(
          `https://api.openrouteservice.org/geocode/search?text=${searchValue}`,
          {
            headers: {
              Authorization: OPENROUTESERVICE_API_KEY,
            },
          }
        );

        const { features } = response.data;

        if (features && features.length > 0) {
          const { geometry, properties } = features[0];
          const { coordinates } = geometry;

          setMapRegion({
            latitude: coordinates[1],
            longitude: coordinates[0],
            latitudeDelta: 0.95,
            longitudeDelta: 0.95,
          });

          setSelectedPlace(properties.label);
          setShowPlaceModal(true);

        
          fetchNearbyPlaces(coordinates[1], coordinates[0]);
        }
      } catch (error) {
        Alert.alert(error.message);
      }
    }
  };

  const fetchNearbyPlaces = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://api.openrouteservice.org/pois?request=pois&geojson={"type":"Point","coordinates":[${longitude},${latitude}]}&buffer=1000&limit=5`,
        {
          headers: {
            Authorization: OPENROUTESERVICE_API_KEY,
          },
        }
      );

      const { features } = response.data;

      
      setNearbyPlaces(features);
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  const handleCenterUserLocation = () => {
    if (userLocation) {
      mapViewRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.009,
        longitudeDelta: 0.009,
      });
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        ref={mapViewRef}
        mapType={mapType}
        customMapStyle={[
          {
            elementType: 'geometry',
            stylers: [{ color: '#f5f5f5' }],
          },
          {
            elementType: 'labels.icon',
            stylers: [{ visibility: 'off' }],
          },
          {
            elementType: 'labels.text.fill',
            stylers: [{ color: '#616161' }],
          },
          {
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#f5f5f5' }],
          },
          {
            featureType: 'administrative.land_parcel',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#bdbdbd' }],
          },
          {
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [{ color: '#eeeeee' }],
          },
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#757575' }],
          },
          {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#e5e5e5' }],
          },
          {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9e9e9e' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }],
          },
          {
            featureType: 'road.arterial',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#757575' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#dadada' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#616161' }],
          },
          {
            featureType: 'road.local',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9e9e9e' }],
          },
          {
            featureType: 'transit.line',
            elementType: 'geometry',
            stylers: [{ color: '#e5e5e5' }],
          },
          {
            featureType: 'transit.station',
            elementType: 'geometry',
            stylers: [{ color: '#eeeeee' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#c9c9c9' }],
          },
          {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9e9e9e' }],
          },
        ]}
      
      >
        {mapRegion && (
          <>
            <Marker
              title="Location you searched for!"
              coordinate={{
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude,
              }}
              draggable
              pinColor="blue"
              onPress={() => {
                setSelectedPlace('Selected Location');
                setShowPlaceModal(true);
              }}
            />
            <Circle
              center={{
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude,
              }}
              radius={1000}
              fillColor="rgba(255, 0, 0, 0.2)"
              strokeColor="rgba(255, 0, 75, 0.5)"
            />
          </>
        )}
      </MapView>
      <View style={styles.sidebar}>
        <TouchableOpacity
          style={styles.centerButton}
          onPress={handleCenterUserLocation}
        >
          <FontAwesome5 name="location-arrow" size={30} color="#007BFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Location"
          value={searchValue}
          onChangeText={(text) => setSearchValue(text)}
          onEndEditing={handleSearch}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <FontAwesome5 name="search" size={20} color="white" />
        </TouchableOpacity>
        {searchValue !== '' && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <MaterialCommunityIcons name="close" size={20} color="black" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.zoomContainer}>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
          <MaterialCommunityIcons name="plus" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
          <MaterialCommunityIcons name="minus" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapTypeContainer}>
        <Button
          title="Hybrid"
          onPress={() => handleMapTypeChange(MAP_TYPES.HYBRID)}
          color={mapType === MAP_TYPES.HYBRID ? '#007BFF' : '#999999'}
        />
        <Button
          title="Satellite"
          onPress={() => handleMapTypeChange(MAP_TYPES.SATELLITE)}
          color={mapType === MAP_TYPES.SATELLITE ? '#007BFF' : '#999999'}
        />
        <Button
          title="Normal"
          onPress={() => handleMapTypeChange(MAP_TYPES.STANDARD)}
          color={mapType === MAP_TYPES.STANDARD ? '#007BFF' : '#999999'}
        />
        <Button
          title="Terrain"
          onPress={() => handleMapTypeChange(MAP_TYPES.TERRAIN)}
          color={mapType === MAP_TYPES.TERRAIN ? '#007BFF' : '#999999'}
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showPlaceModal}
        onRequestClose={() => {
          setShowPlaceModal(!showPlaceModal);
        }}
      >
        <View style={styles.placeModal}>
          <Text style={styles.placeModalText}>{selectedPlace}</Text>
          <Button
            title="Close"
            onPress={() => setShowPlaceModal(!showPlaceModal)}
          />
        </View>
      </Modal>
      <ScrollView style={styles.nearbyPlacesContainer}>
        {nearbyPlaces.map((place, index) => (
          <TouchableOpacity
            key={index}
            style={styles.nearbyPlaceItem}
            onPress={() => {
              // Handle the press on a nearby place item
              Alert('Selected nearby place:', place);
            }}
          >
            <Text>{place.properties.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  
  sidebar: {
    position: 'absolute',
    top: Dimensions.get('window').height / 2 - 40,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 10,
  },
  centerButton: {
    padding: 10,
  },
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 13,
    marginRight: 22,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1,
    padding: 5,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 15,
    fontSize: 20,
  },
  searchButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
  },
  clearButton: {
    marginLeft: 10,
    padding: 10,
  },
  zoomContainer: {
    position: 'absolute',
    bottom: 160,
    right: 17,
    flexDirection: 'column',
    alignItems: 'center',
  },
  zoomButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  mapTypeContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 10,
  },
  placeModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  placeModalText: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  nearbyPlacesContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 10,
    maxHeight: 150,
  },
  nearbyPlaceItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 10,
  },
});

export default Map;

import axios from 'axios';
import qs from 'qs';

const getLatLng = async locationStr => {
  try {
    const queries = qs.stringify({
      q: locationStr,
      key: '55f3c34bb9a3424d96a72154deca11ea',
      no_annotations: '1',
      language: 'en'
    });

    const res = await axios.get(`https://api.opencagedata.com/geocode/v1/json?${queries}`);

    const { lat, lng } = res.data.results[0].geometry;

    return [lng, lat];
  } catch (e) {
    console.error(e);
    return null;
  }
};

export default getLatLng;

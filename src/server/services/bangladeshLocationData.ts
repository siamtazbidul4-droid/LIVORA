import {
  districts_en,
  divisions_en,
  unions_en,
  upazilas_en,
} from 'bangladesh-location-data';
import {
  districts_bn,
  divisions_bn,
  unions_bn,
  upazilas_bn,
} from 'bangladesh-location-data/bangla';
import type { LocationItem, LocationMap } from 'bangladesh-location-data';
import {
  BangladeshAddressLocation,
  BangladeshLocationData,
  DivisionLocation,
  LocationOption,
  resolveBangladeshLocation,
} from '../../lib/bangladeshLocations';

function namesById(items: LocationItem[]): Map<number, string> {
  return new Map(items.map((item) => [item.value, item.title]));
}

function makeOptions(
  english: LocationItem[],
  banglaMap: LocationMap,
  parentId?: number
): LocationOption[] {
  const banglaById = namesById(parentId === undefined ? [] : banglaMap[String(parentId)] || []);
  return english.map((item) => ({
    id: item.value,
    name: item.title,
    nameBn: banglaById.get(item.value) || item.title,
  }));
}

const divisionBanglaById = namesById(divisions_bn);
const districtBangla = districts_bn as LocationMap;
const upazilaBangla = upazilas_bn as LocationMap;
const unionBangla = unions_bn as LocationMap;

export const BANGLADESH_LOCATION_DATA: BangladeshLocationData = divisions_en.map((division) => {
  const districts = (districts_en[String(division.value)] || []).map((district) => {
    const upazilas = (upazilas_en[String(district.value)] || []).map((upazila) => ({
      ...makeOptions([upazila], upazilaBangla, district.value)[0],
      unions: makeOptions(
        unions_en[String(upazila.value)] || [],
        unionBangla,
        upazila.value
      ),
    }));

    return {
      ...makeOptions([district], districtBangla, division.value)[0],
      upazilas,
    };
  });

  return {
    id: division.value,
    name: division.title,
    nameBn: divisionBanglaById.get(division.value) || division.title,
    districts,
  } satisfies DivisionLocation;
});

export const BANGLADESH_LOCATION_COUNTS = {
  divisions: divisions_en.length,
  districts: Object.values(districts_en).reduce((count, items) => count + items.length, 0),
  upazilas: Object.values(upazilas_en).reduce((count, items) => count + items.length, 0),
  unions: Object.values(unions_en).reduce((count, items) => count + items.length, 0),
};

export function validateBangladeshLocation(
  address: BangladeshAddressLocation,
  requireUnion = false
) {
  return resolveBangladeshLocation(address, requireUnion, BANGLADESH_LOCATION_DATA);
}


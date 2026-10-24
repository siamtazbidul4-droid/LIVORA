import { describe, expect, it } from 'vitest';
import {
  getDistrictsByDivision,
  getDivisions,
  getUnionsByUpazila,
  getUpazilasByDistrict,
  selectDistrict,
  selectDivision,
  selectUpazila,
} from '../../lib/bangladeshLocations';
import {
  BANGLADESH_LOCATION_COUNTS,
  BANGLADESH_LOCATION_DATA,
  validateBangladeshLocation,
} from '../services/bangladeshLocationData';

describe('Bangladesh administrative locations', () => {
  const data = BANGLADESH_LOCATION_DATA;

  it('loads the package hierarchy with stable unique IDs and expected coverage', () => {
    expect(BANGLADESH_LOCATION_COUNTS.divisions).toBe(8);
    expect(BANGLADESH_LOCATION_COUNTS.districts).toBe(64);
    expect(BANGLADESH_LOCATION_COUNTS.upazilas).toBeGreaterThanOrEqual(490);
    expect(BANGLADESH_LOCATION_COUNTS.unions).toBeGreaterThanOrEqual(4500);

    const divisionIds = getDivisions(data).map((item) => item.id);
    const districtIds = getDivisions(data).flatMap((division) =>
      getDistrictsByDivision(division.id, data).map((district) => district.id)
    );
    expect(new Set(divisionIds).size).toBe(divisionIds.length);
    expect(new Set(districtIds).size).toBe(districtIds.length);
  });

  it('filters districts, Upazilas, and Unions by their actual parent IDs', () => {
    const division = getDivisions(data)[0];
    const district = getDistrictsByDivision(division.id, data)[0];
    const upazila = getUpazilasByDistrict(district.id, data)[0];
    const union = getUnionsByUpazila(upazila.id, data)[0];

    expect(division).toBeDefined();
    expect(district).toBeDefined();
    expect(upazila).toBeDefined();
    expect(union).toBeDefined();
    expect(getDistrictsByDivision(-1, data)).toEqual([]);
    expect(getUpazilasByDistrict(-1, data)).toEqual([]);
    expect(getUnionsByUpazila(-1, data)).toEqual([]);
  });

  it('clears descendant selections whenever a parent location changes', () => {
    const division = selectDivision(1);
    const district = selectDistrict(
      { ...division, districtId: 2, upazilaId: 3, unionId: 4 },
      5
    );
    const upazila = selectUpazila({ ...district, upazilaId: 6, unionId: 7 }, 8);

    expect(division).toEqual({
      divisionId: 1,
      districtId: null,
      upazilaId: null,
      unionId: null,
    });
    expect(district).toEqual({
      divisionId: 1,
      districtId: 5,
      upazilaId: null,
      unionId: null,
    });
    expect(upazila).toEqual({
      divisionId: 1,
      districtId: 5,
      upazilaId: 8,
      unionId: null,
    });
  });

  it('normalizes valid identifiers and rejects fabricated or mismatched parent-child IDs', () => {
    const division = getDivisions(data)[0];
    const district = getDistrictsByDivision(division.id, data)[0];
    const upazila = getUpazilasByDistrict(district.id, data)[0];
    const union = getUnionsByUpazila(upazila.id, data)[0];

    expect(
      validateBangladeshLocation({
        divisionId: division.id,
        districtId: district.id,
        upazilaId: upazila.id,
        unionId: union.id,
      }, true)
    ).toMatchObject({
      division: division.name,
      district: district.name,
      upazila: upazila.name,
      union: union.name,
    });
    expect(
      validateBangladeshLocation({
        divisionId: division.id,
        districtId: -1,
        district: district.name,
        upazilaId: upazila.id,
        unionId: union.id,
      }, true)
    ).toBeNull();
    expect(
      validateBangladeshLocation({
        divisionId: division.id,
        districtId: district.id,
        upazilaId: upazila.id,
        unionId: -1,
        union: union.name,
      }, true)
    ).toBeNull();
  });

  it('resolves unambiguous legacy labels while requiring a union when the dataset has one', () => {
    const division = getDivisions(data)[0];
    const district = getDistrictsByDivision(division.id, data)[0];
    const upazila = getUpazilasByDistrict(district.id, data)[0];
    const union = getUnionsByUpazila(upazila.id, data)[0];
    const legacyAddress = {
      division: division.name,
      district: district.name,
      upazila: upazila.name,
    };

    expect(validateBangladeshLocation(legacyAddress)).toMatchObject({
      divisionId: division.id,
      districtId: district.id,
      upazilaId: upazila.id,
    });
    expect(validateBangladeshLocation(legacyAddress, true)).toBeNull();
    expect(
      validateBangladeshLocation({
        ...legacyAddress,
        union: union.name,
      }, true)
    ).toMatchObject({ unionId: union.id });
  });
});

export interface LocationOption {
  id: number;
  name: string;
  nameBn: string;
}

export interface UpazilaLocation extends LocationOption {
  unions: LocationOption[];
}

export interface DistrictLocation extends LocationOption {
  upazilas: UpazilaLocation[];
}

export interface DivisionLocation extends LocationOption {
  districts: DistrictLocation[];
}

export type BangladeshLocationData = DivisionLocation[];

export interface BangladeshLocationSelection {
  divisionId: number | null;
  districtId: number | null;
  upazilaId: number | null;
  unionId: number | null;
}

export interface BangladeshAddressLocation {
  divisionId?: number | string | null;
  districtId?: number | string | null;
  upazilaId?: number | string | null;
  unionId?: number | string | null;
  division?: string;
  district?: string;
  upazila?: string;
  union?: string;
}

export interface NormalizedBangladeshLocation {
  divisionId: number;
  districtId: number;
  upazilaId: number;
  unionId?: number;
  division: string;
  district: string;
  upazila: string;
  union?: string;
}

let locationData: BangladeshLocationData = [];

export function selectDivision(
  divisionId: number | null
): BangladeshLocationSelection {
  return { divisionId, districtId: null, upazilaId: null, unionId: null };
}

export function selectDistrict(
  selection: BangladeshLocationSelection,
  districtId: number | null
): BangladeshLocationSelection {
  return { ...selection, districtId, upazilaId: null, unionId: null };
}

export function selectUpazila(
  selection: BangladeshLocationSelection,
  upazilaId: number | null
): BangladeshLocationSelection {
  return { ...selection, upazilaId, unionId: null };
}

export function setBangladeshLocationData(data: BangladeshLocationData): void {
  locationData = data;
}

export function hasBangladeshLocationData(): boolean {
  return locationData.length > 0;
}

export const getDivisions = (data = locationData): LocationOption[] =>
  data.map(({ id, name, nameBn }) => ({ id, name, nameBn }));

export const getDistrictsByDivision = (
  divisionId: number | null,
  data = locationData
): LocationOption[] =>
  data.find((division) => division.id === divisionId)?.districts.map(({ id, name, nameBn }) => ({
    id,
    name,
    nameBn,
  })) || [];

export const getUpazilasByDistrict = (
  districtId: number | null,
  data = locationData
): LocationOption[] =>
  data
    .flatMap((division) => division.districts)
    .find((district) => district.id === districtId)
    ?.upazilas.map(({ id, name, nameBn }) => ({ id, name, nameBn })) || [];

export const getUnionsByUpazila = (
  upazilaId: number | null,
  data = locationData
): LocationOption[] =>
  data
    .flatMap((division) => division.districts)
    .flatMap((district) => district.upazilas)
    .find((upazila) => upazila.id === upazilaId)
    ?.unions || [];

function parseId(value: number | string | null | undefined): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function findByName(options: LocationOption[], name?: string): LocationOption | undefined {
  if (!name?.trim()) return undefined;
  const normalized = name.trim().toLocaleLowerCase();
  const matches = options.filter(
    (option) =>
      option.name.toLocaleLowerCase() === normalized ||
      option.nameBn.toLocaleLowerCase() === normalized
  );
  return matches.length === 1 ? matches[0] : undefined;
}

function resolveOption(
  options: LocationOption[],
  idValue: number | string | null | undefined,
  name: string | undefined
): LocationOption | undefined {
  if (idValue !== undefined) {
    const id = parseId(idValue);
    return id === undefined ? undefined : options.find((option) => option.id === id);
  }
  return findByName(options, name);
}

export function resolveBangladeshLocation(
  address: BangladeshAddressLocation,
  requireUnion = false,
  data = locationData
): NormalizedBangladeshLocation | null {
  const division = resolveOption(getDivisions(data), address.divisionId, address.division);
  if (!division) return null;

  const district = resolveOption(
    getDistrictsByDivision(division.id, data),
    address.districtId,
    address.district
  );
  if (!district) return null;

  const upazila = resolveOption(
    getUpazilasByDistrict(district.id, data),
    address.upazilaId,
    address.upazila
  );
  if (!upazila) return null;

  const upazilaData = data
    .flatMap((item) => item.districts)
    .flatMap((item) => item.upazilas)
    .find((item) => item.id === upazila.id);
  const unions = upazilaData?.unions || [];
  const union = resolveOption(unions, address.unionId, address.union);
  if (requireUnion && unions.length > 0 && !union) return null;
  if (address.unionId != null && !union) return null;
  if (address.union?.trim() && !union) return null;

  return {
    divisionId: division.id,
    districtId: district.id,
    upazilaId: upazila.id,
    ...(union ? { unionId: union.id, union: union.name } : {}),
    division: division.name,
    district: district.name,
    upazila: upazila.name,
  };
}

export function getBangladeshLocationSelection(
  address: BangladeshAddressLocation,
  data = locationData
): BangladeshLocationSelection {
  const resolved = resolveBangladeshLocation(address, false, data);
  return {
    divisionId: resolved?.divisionId ?? null,
    districtId: resolved?.districtId ?? null,
    upazilaId: resolved?.upazilaId ?? null,
    unionId: resolved?.unionId ?? null,
  };
}

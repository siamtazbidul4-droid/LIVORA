import React from 'react';
import type { BangladeshLocationSelection } from '../../lib/bangladeshLocations';
import {
  getDistrictsByDivision,
  getDivisions,
  getUnionsByUpazila,
  getUpazilasByDistrict,
  selectDistrict,
  selectDivision,
  selectUpazila,
} from '../../lib/bangladeshLocations';

interface BangladeshAddressFieldsProps {
  value: BangladeshLocationSelection;
  onChange: (value: BangladeshLocationSelection) => void;
  isLoading?: boolean;
  error?: string | null;
}

const selectClassName =
  'w-full rounded-lg border border-stone-200 px-3 py-2 text-xs focus:border-[#133E32] focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400';

export const BangladeshAddressFields: React.FC<BangladeshAddressFieldsProps> = ({
  value,
  onChange,
  isLoading = false,
  error = null,
}) => {
  const divisions = getDivisions();
  const districts = getDistrictsByDivision(value.divisionId);
  const upazilas = getUpazilasByDistrict(value.districtId);
  const unions = getUnionsByUpazila(value.upazilaId);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
      <div>
        <label htmlFor="address-division" className="block text-xs font-medium text-stone-700 mb-1">
          Division *
        </label>
        <select
          id="address-division"
          required
          disabled={isLoading || Boolean(error)}
          value={value.divisionId ?? ''}
          onChange={(event) =>
            onChange(selectDivision(event.target.value ? Number(event.target.value) : null))
          }
          className={selectClassName}
        >
          <option value="">{isLoading ? 'Loading divisions...' : 'Select division'}</option>
          {divisions.map((division) => (
            <option key={division.id} value={division.id}>
              {division.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="address-district" className="block text-xs font-medium text-stone-700 mb-1">
          District *
        </label>
        <select
          id="address-district"
          required
          disabled={isLoading || Boolean(error) || !value.divisionId || districts.length === 0}
          value={value.districtId ?? ''}
          onChange={(event) =>
            onChange(selectDistrict(value, event.target.value ? Number(event.target.value) : null))
          }
          className={selectClassName}
        >
          <option value="">
            {isLoading
              ? 'Loading districts...'
              : !value.divisionId
              ? 'Select a division first'
              : districts.length === 0
                ? 'No districts available'
                : 'Select district'}
          </option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="address-upazila" className="block text-xs font-medium text-stone-700 mb-1">
          Upazila / Thana *
        </label>
        <select
          id="address-upazila"
          required
          disabled={isLoading || Boolean(error) || !value.districtId || upazilas.length === 0}
          value={value.upazilaId ?? ''}
          onChange={(event) =>
            onChange(selectUpazila(value, event.target.value ? Number(event.target.value) : null))
          }
          className={selectClassName}
        >
          <option value="">
            {isLoading
              ? 'Loading Upazilas...'
              : !value.districtId
              ? 'Select a district first'
              : upazilas.length === 0
                ? 'No Upazilas available'
                : 'Select Upazila / Thana'}
          </option>
          {upazilas.map((upazila) => (
            <option key={upazila.id} value={upazila.id}>
              {upazila.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="address-union" className="block text-xs font-medium text-stone-700 mb-1">
          Union{unions.length > 0 ? ' *' : ''}
        </label>
        <select
          id="address-union"
          required={unions.length > 0}
          disabled={isLoading || Boolean(error) || !value.upazilaId || unions.length === 0}
          value={value.unionId ?? ''}
          onChange={(event) =>
            onChange({
              ...value,
              unionId: event.target.value ? Number(event.target.value) : null,
            })
          }
          className={selectClassName}
        >
          <option value="">
            {isLoading
              ? 'Loading unions...'
              : !value.upazilaId
              ? 'Select an Upazila first'
              : unions.length === 0
                ? 'No unions available for this Upazila'
                : 'Select union'}
          </option>
          {unions.map((union) => (
            <option key={union.id} value={union.id}>
              {union.name}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p role="alert" className="sm:col-span-2 text-[11px] text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
};

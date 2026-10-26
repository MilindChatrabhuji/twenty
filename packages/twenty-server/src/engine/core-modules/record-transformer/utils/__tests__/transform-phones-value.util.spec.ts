import { transformPhonesValue } from 'src/engine/core-modules/record-transformer/utils/transform-phones-value.util';

describe('transformPhonesValue', () => {
  it('should return null when input is null', () => {
    const result = transformPhonesValue({ input: null });

    expect(result).toBeNull();
  });

  it('should normalize all empty primary sub-fields to null', () => {
    const result = transformPhonesValue({
      input: {
        primaryPhoneNumber: '',
        primaryPhoneCallingCode: '',
        primaryPhoneCountryCode: '',
      },
    });

    expect(result).toEqual({
      additionalPhones: null,
      primaryPhoneNumber: null,
      primaryPhoneCallingCode: null,
      primaryPhoneCountryCode: null,
    });
  });

  it('should drop an additionalPhones entry that has no number', () => {
    const result = transformPhonesValue({
      input: {
        primaryPhoneNumber: '',
        additionalPhones: JSON.stringify([{ number: '' }]),
      },
    });

    expect(result?.additionalPhones).toBeNull();
  });

  it('should keep valid additionalPhones entries while dropping numberless ones', () => {
    const result = transformPhonesValue({
      input: {
        primaryPhoneNumber: '',
        additionalPhones: JSON.stringify([
          { number: '' },
          { number: '+442071838750', callingCode: '+44', countryCode: 'GB' },
        ]),
      },
    });

    expect(result?.additionalPhones).toBe(
      JSON.stringify([
        { countryCode: 'GB', callingCode: '+44', number: '2071838750' },
      ]),
    );
  });

  it('should parse a valid international phone number into its canonical parts', () => {
    const result = transformPhonesValue({
      input: { primaryPhoneNumber: '+14155552671' },
    });

    expect(result).toEqual({
      additionalPhones: null,
      primaryPhoneNumber: '4155552671',
      primaryPhoneCallingCode: '+1',
      primaryPhoneCountryCode: 'US',
    });
  });

  it('should infer callingCode from the number when callingCode is an empty string', () => {
    const result = transformPhonesValue({
      input: {
        primaryPhoneNumber: '+14155552671',
        primaryPhoneCallingCode: '',
      },
    });

    expect(result).toEqual({
      additionalPhones: null,
      primaryPhoneNumber: '4155552671',
      primaryPhoneCallingCode: '+1',
      primaryPhoneCountryCode: 'US',
    });
  });

  it('should accept additionalPhones as an array of phone objects', () => {
    const result = transformPhonesValue({
      input: {
        primaryPhoneNumber: '+14155552671',
        additionalPhones: [
          { number: '+442071838750', callingCode: '+44', countryCode: 'GB' },
        ],
      },
    });

    expect(result?.additionalPhones).toBe(
      JSON.stringify([
        { countryCode: 'GB', callingCode: '+44', number: '2071838750' },
      ]),
    );
  });

  describe('phone number length and character validation (#28764)', () => {
    it('should throw when phone number contains letters instead of silently dropping them', () => {
      expect(() =>
        transformPhonesValue({
          input: {
            primaryPhoneNumber: '088-ABC',
            primaryPhoneCallingCode: '+359',
          },
        }),
      ).toThrow('Provided phone number is invalid 088-ABC');
    });

    it('should throw when phone number is too short to be a valid phone number for the country', () => {
      expect(() =>
        transformPhonesValue({
          input: {
            primaryPhoneNumber: '12',
            primaryPhoneCallingCode: '+359',
          },
        }),
      ).toThrow('Provided phone number is invalid 12');

      expect(() =>
        transformPhonesValue({
          input: {
            primaryPhoneNumber: '888',
            primaryPhoneCallingCode: '+359',
          },
        }),
      ).toThrow('Provided phone number is invalid 888');
    });

    it('should throw when phone number exceeds max E.164 length of 15 digits', () => {
      expect(() =>
        transformPhonesValue({
          input: {
            primaryPhoneNumber: '08812345678901234',
            primaryPhoneCallingCode: '+359',
          },
        }),
      ).toThrow('Provided phone number is invalid 08812345678901234');
    });

    it('should successfully parse a valid phone number with matching calling code', () => {
      const result = transformPhonesValue({
        input: {
          primaryPhoneNumber: '0881234567',
          primaryPhoneCallingCode: '+359',
        },
      });

      expect(result).toEqual({
        additionalPhones: null,
        primaryPhoneNumber: '881234567',
        primaryPhoneCallingCode: '+359',
        primaryPhoneCountryCode: 'BG',
      });
    });
  });
});

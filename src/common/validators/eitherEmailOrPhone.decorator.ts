import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function EitherEmailOrPhone(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'eitherEmailOrPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const { email, phoneNumber } = args.object as any;
          return !!(email || phoneNumber);
        },
        defaultMessage() {
          return 'Either email or phone number must be provided';
        },
      },
    });
  };
}

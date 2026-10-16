import {
	FieldType,
	type SignerDto,
	type TemplatePreparationFieldDto,
	TemplatePreparationMode,
} from '@korala/api-client';

export const EXAMPLE_ROLES = ['Recipient', 'Approver'] as const;
export const SAMPLE_PAGE = { width: 600, height: 800 };
export const SAMPLE_X = 48;
export const SAMPLE_WIDTH = 372;
export const SAMPLE_ROWS = [165, 275, 385, 495, 605] as const;

export function rolesFor(multiple: boolean) {
	return EXAMPLE_ROLES.slice(0, multiple ? 2 : 1).map((name, i) => ({
		name,
		signingOrder: i + 1,
	}));
}

export function reviewFields(multiple: boolean): TemplatePreparationFieldDto[] {
	return rolesFor(multiple).flatMap(({ name: signerRoleName }) => [
		...Array.from({ length: 3 }, (_, i) => ({
			fieldType: FieldType.Text,
			label: `${signerRoleName} name ${i + 1}`,
			mergeFieldName: `${signerRoleName.toLowerCase()}_name_${i + 1}`,
			signerRoleName,
			valueKey: 'legal_name',
			removable: true,
			required: true,
		})),
		{
			fieldType: FieldType.Signature,
			label: `${signerRoleName} signature`,
			mergeFieldName: `${signerRoleName.toLowerCase()}_signature`,
			signerRoleName,
			required: true,
		},
		{
			fieldType: FieldType.Date,
			label: `${signerRoleName} date signed`,
			mergeFieldName: `${signerRoleName.toLowerCase()}_date`,
			signerRoleName,
			required: true,
			signingDate: true,
		},
	]);
}

export function preparationConfig(
	mode: string,
	multiple: boolean,
	parentOrigin: string,
) {
	if (
		mode !== TemplatePreparationMode.Review &&
		mode !== TemplatePreparationMode.Full
	)
		throw new Error('Choose Review or Full mode.');
	return {
		name: 'Example agreement',
		mode,
		parentOrigin,
		signerRoles: rolesFor(multiple),
		...(mode === TemplatePreparationMode.Review
			? { fields: reviewFields(multiple) }
			: {}),
	};
}

export function person(name: unknown, email: unknown) {
	if (typeof name !== 'string' || !name.trim() || name.trim().length > 100)
		throw new Error('Enter a name of up to 100 characters.');
	if (
		typeof email !== 'string' ||
		email.length > 254 ||
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
	)
		throw new Error('Enter a valid email address.');
	return { name: name.trim(), email: email.trim() };
}

/** Template role names are not copied to the document signer's generic role. */
export function signersInOrder(
	signers: SignerDto[],
	orders: (number | undefined)[],
) {
	if (
		signers.length !== orders.length ||
		new Set(orders).size !== orders.length
	)
		throw new Error('The generated document has unexpected signers.');
	return orders.map((order) => {
		const matches = signers.filter((s) => s.signingOrder === order);
		if (order === undefined || matches.length !== 1 || !matches[0].accessToken)
			throw new Error('The generated document is missing its signer links.');
		return matches[0];
	});
}

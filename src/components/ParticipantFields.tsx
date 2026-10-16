import { useId } from 'react';
export function ParticipantFields({
	multiple = false,
}: {
	multiple?: boolean;
}) {
	const id = useId();
	return (
		<div className="participants">
			{[false, ...(multiple ? [true] : [])].map((approver) => (
				<fieldset key={String(approver)}>
					<legend>{approver ? 'Approver · signs second' : 'Recipient'}</legend>
					<label htmlFor={`${id}-${approver}-name`}>Name</label>
					<input
						id={`${id}-${approver}-name`}
						name={approver ? 'approverName' : 'name'}
						required
						maxLength={100}
						defaultValue={approver ? 'Jamie Example' : 'Alex Example'}
						autoComplete="off"
					/>
					<label htmlFor={`${id}-${approver}-email`}>Email</label>
					<input
						id={`${id}-${approver}-email`}
						name={approver ? 'approverEmail' : 'email'}
						type="email"
						required
						maxLength={254}
						defaultValue={approver ? 'jamie@example.com' : 'alex@example.com'}
						autoComplete="off"
					/>
				</fieldset>
			))}
		</div>
	);
}

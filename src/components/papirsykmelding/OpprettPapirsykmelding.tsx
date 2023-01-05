/* eslint-disable @typescript-eslint/no-explicit-any */

import { Alert, Button, Checkbox, Heading, Select, TextField } from '@navikt/ds-react';
import React, { useState } from 'react';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { format, sub } from 'date-fns';
import { Datepicker } from '@navikt/ds-datepicker';

import { Periode, SykmeldingType } from '../../types/sykmelding/Periode';
import DiagnosePicker, { Diagnose } from '../formComponents/DiagnosePicker/DiagnosePicker';

import styles from './OpprettPapirsykmelding.module.css';

interface FormValues {
    fnr: string;
    hprNummer: string;
    syketilfelleStartdato: string;
    behandletDato: string;
    perioder: Periode[];
    utenOcr: boolean;
    hoveddiagnose: Diagnose;
}

type OpprettPapirsykmeldingApiBody = Omit<FormValues, 'hoveddiagnose'> & {
    diagnosekodesystem: 'icd10' | 'icpc2';
    diagnosekode: string;
};

function OpprettPapirsykmelding(): JSX.Element {
    const date = new Date();
    const iGar = format(sub(date, { days: 1 }), 'yyyy-MM-dd');
    const enUkeSiden = format(sub(date, { days: 7 }), 'yyyy-MM-dd');
    const {
        getValues,
        trigger,
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: {
            syketilfelleStartdato: enUkeSiden,
            behandletDato: enUkeSiden,
            perioder: [{ fom: enUkeSiden, tom: iGar, type: SykmeldingType.Enum.HUNDREPROSENT }],
            hoveddiagnose: { system: 'icd10', code: 'H100', text: 'Mukopurulent konjunktivitt' },
        },
    });
    const {
        fields: periodeFields,
        append,
        remove,
    } = useFieldArray({
        control,
        name: 'perioder',
    });
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const OPPRETT_SYKMELDING_URL = `/api/proxy/papirsykmelding/opprett`;

    const postData = async (data: FormValues): Promise<void> => {
        setError(null);
        setResult(null);
        setRegelError(null);
        setRegelResult(null);
        const postData: OpprettPapirsykmeldingApiBody = {
            fnr: data.fnr,
            hprNummer: data.hprNummer,
            syketilfelleStartdato: data.syketilfelleStartdato,
            behandletDato: data.behandletDato,
            perioder: data.perioder,
            utenOcr: data.utenOcr,
            diagnosekodesystem: data.hoveddiagnose.system,
            diagnosekode: data.hoveddiagnose.code,
        };

        const response = await fetch(OPPRETT_SYKMELDING_URL, {
            method: 'POST',
            body: JSON.stringify(postData),
        });

        if (response.ok) {
            setResult((await response.json()).message);
        } else {
            setError((await response.json()).message);
        }
    };

    const [regelError, setRegelError] = useState<string | null>(null);
    const [regelResult, setRegelResult] = useState<string | null>(null);
    const REGELSJEKK_URL = `/api/proxy/papirsykmelding/regelsjekk`;

    const postDataRegelsjekk = async (data: FormValues): Promise<void> => {
        setError(null);
        setResult(null);
        setRegelError(null);
        setRegelResult(null);
        const postData: OpprettPapirsykmeldingApiBody = {
            fnr: data.fnr,
            hprNummer: data.hprNummer,
            syketilfelleStartdato: data.syketilfelleStartdato,
            behandletDato: data.behandletDato,
            perioder: data.perioder,
            utenOcr: data.utenOcr,
            diagnosekodesystem: data.hoveddiagnose.system,
            diagnosekode: data.hoveddiagnose.code,
        };

        const response = await fetch(REGELSJEKK_URL, {
            method: 'POST',
            body: JSON.stringify(postData),
        });

        if (response.ok) {
            setRegelResult(JSON.stringify(await response.json(), null, 2));
        } else {
            setRegelError((await response.json()).message);
        }
    };

    return (
        <form onSubmit={handleSubmit(postData)}>
            <Heading size="medium" level="2" spacing>
                Opprett papirsykmelding
            </Heading>
            <TextField
                className={styles.commonFormElement}
                {...register('fnr', { required: true })}
                label="Fødselsnummer"
                error={errors.fnr && 'Fødselsnummer for pasienten mangler'}
            />
            <div className={styles.periodeFields}>
                {periodeFields.map((it, index) => (
                    <div key={it.id} className={styles.periodeFieldRow}>
                        <div>
                            <p>
                                <b>Fom</b>
                            </p>
                            <Controller
                                control={control}
                                name={`perioder.${index}.fom`}
                                render={({ field }) => <Datepicker onChange={field.onChange} value={field.value} />}
                            />
                        </div>
                        <div>
                            <p>
                                <b>Tom</b>
                            </p>
                            <Controller
                                control={control}
                                name={`perioder.${index}.tom`}
                                render={({ field }) => <Datepicker onChange={field.onChange} value={field.value} />}
                            />
                        </div>
                        <Select {...register(`perioder.${index}.type`)} label="Sykmeldingstype">
                            <option value="HUNDREPROSENT">HUNDREPROSENT</option>
                            <option value="AVVENTENDE">AVVENTENDE</option>
                            <option value="GRADERT_20">GRADERT_20</option>
                            <option value="GRADERT_40">GRADERT_40</option>
                            <option value="GRADERT_50">GRADERT_50</option>
                            <option value="GRADERT_60">GRADERT_60</option>
                            <option value="GRADERT_80">GRADERT_80</option>
                            <option value="GRADERT_REISETILSKUDD">GRADERT_REISETILSKUDD</option>
                            <option value="BEHANDLINGSDAGER">BEHANDLINGSDAGER</option>
                            <option value="BEHANDLINGSDAG">BEHANDLINGSDAG</option>
                            <option value="REISETILSKUDD">REISETILSKUDD</option>
                        </Select>
                        <Button type="button" onClick={() => remove(index)} variant="tertiary">
                            Slett
                        </Button>
                    </div>
                ))}
            </div>
            <div className={styles.periodeButton}>
                <Button
                    type="button"
                    onClick={() => append({ fom: enUkeSiden, tom: iGar, type: SykmeldingType.Enum.HUNDREPROSENT })}
                >
                    Legg til periode
                </Button>
            </div>
            <TextField
                className={styles.commonFormElement}
                {...register('hprNummer')}
                label="HPR-nummer"
                defaultValue={'7125186'}
            />
            <p>
                <b>Startdato på syketilfelle</b>
            </p>
            <Controller
                control={control}
                name="syketilfelleStartdato"
                render={({ field }) => <Datepicker onChange={(date) => field.onChange(date)} value={field.value} />}
            />
            <p>
                <b>Behandlingsdato</b>
            </p>
            <Controller
                control={control}
                name="behandletDato"
                render={({ field }) => <Datepicker onChange={(date) => field.onChange(date)} value={field.value} />}
            />
            <p>
                <b>Hoveddiagnose</b>
            </p>
            <DiagnosePicker control={control as any} name={'hoveddiagnose'} diagnoseType={'hoveddiagnose'} />

            <Checkbox {...register('utenOcr')}>Opprett papirsykmelding uten OCR</Checkbox>
            <div className={styles.buttons}>
                <Button type="submit">Opprett</Button>
                {error && <Alert variant="error">{error}</Alert>}
                {result && <Alert variant="success">{result}</Alert>}
                <Button
                    variant="secondary"
                    type="button"
                    onClick={async () => {
                        const validationResult = await trigger(undefined, { shouldFocus: true });
                        if (!validationResult) {
                            return;
                        }
                        return postDataRegelsjekk(getValues());
                    }}
                >
                    Valider mot regler
                </Button>
                {regelError && <Alert variant="error">{regelError}</Alert>}
                {regelResult && <Alert variant="success">{regelResult}</Alert>}
            </div>
        </form>
    );
}

export default OpprettPapirsykmelding;

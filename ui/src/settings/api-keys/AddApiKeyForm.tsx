import React, { FormEvent, useCallback, useContext, useState } from 'react'
import { useMutation } from 'react-apollo-hooks'
import { RouteComponentProps } from 'react-router'
import { useFormState } from 'react-use-form-state'

import Button from '../../components/Button'
import FormInputField from '../../components/FormInputField'
import Panel from '../../components/Panel'
import { MessageContext } from '../../context/MessageContext'
import ErrorPanel from '../../error/ErrorPanel'
import { getGQLError, isValidForm, isValidInput } from '../../helpers'
import { usePageTitle } from '../../hooks'
import useOnMountInputValidator from '../../hooks/useOnMountInputValidator'
import { updateCacheAfterCreate } from './cache'
import { CreateOrUpdateApiKeyRequest, CreateOrUpdateApiKeyResponse } from './models'
import { CreateOrUpdateApiKey } from './queries'
import { Link } from 'react-router-dom'

interface AddApiKeyFormFields {
  alias: string
}

type AllProps = RouteComponentProps<{}>

export default ({ history }: AllProps) => {
  usePageTitle('Settings - Add new API key')

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formState, { text }] = useFormState<AddApiKeyFormFields>()
  const onMountValidator = useOnMountInputValidator(formState.validity)
  const addApiKeyMutation = useMutation<CreateOrUpdateApiKeyResponse, CreateOrUpdateApiKeyRequest>(CreateOrUpdateApiKey)
  const { showMessage } = useContext(MessageContext)

  const addApiKey = async (apiKey: CreateOrUpdateApiKeyRequest) => {
    try {
      const res = await addApiKeyMutation({
        variables: apiKey,
        update: updateCacheAfterCreate
      })
      if (res.data) {
        showMessage(`New API key: ${res.data.createOrUpdateAPIKey.alias}`)
        // console.log('New API key', res)
        history.goBack()
      }
    } catch (err) {
      setErrorMessage(getGQLError(err))
    }
  }

  const handleOnSubmit = useCallback(
    (e: FormEvent | MouseEvent) => {
      e.preventDefault()
      if (!isValidForm(formState, onMountValidator)) {
        setErrorMessage('Please fill out correctly the mandatory fields.')
        return
      }
      const { alias } = formState.values
      addApiKey({ alias })
    },
    [formState]
  )

  return (
    <Panel>
      <header>
        <h1>Add new API key</h1>
      </header>
      <section>
        {errorMessage != null && <ErrorPanel title="Unable to add new API key">{errorMessage}</ErrorPanel>}
        <form onSubmit={handleOnSubmit}>
          <FormInputField
            label="Alias"
            {...text('alias')}
            error={!isValidInput(formState, onMountValidator, 'alias')}
            required
            autoFocus
            ref={onMountValidator.bind}
          />
        </form>
      </section>
      <footer>
        <Button title="Back to API keys" as={Link} to="/settings/api-keys">
          Cancel
        </Button>
        <Button title="Add API key" onClick={handleOnSubmit} variant="primary">
          Add
        </Button>
      </footer>
    </Panel>
  )
}

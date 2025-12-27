'use client'

import React from 'react'
import { RegisterAthleteToTournamentDialog } from '../../_components/register-athlete-dialog'
import { Button } from '@acme/ui/button'

const RegisterAthelete = () => {
    const [showRegisterDialog, setShowRegisterDialog] = React.useState(false)
    return (
        <>
            <RegisterAthleteToTournamentDialog
                open={showRegisterDialog}
                onOpenChange={setShowRegisterDialog}
            />

            <Button
                onClick={() => setShowRegisterDialog(true)}
                variant="outline"
                className='cursor-pointer hover:text-primary'
            >
                Inscribir Atleta
            </Button>
        </>
    )
}

export default RegisterAthelete
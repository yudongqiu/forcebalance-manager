from backend.target_validators.abinitio_gmx_validator import AbinitioGMXValidator
from backend.target_validators.abinitio_smirnoff_validator import AbinitioSMIRNOFFValidator

def new_validator(target_type, target_name=None):
    target_validator_dict = {
        'ABINITIO_GMX': AbinitioGMXValidator,
        'ABINITIO_SMIRNOFF': AbinitioSMIRNOFFValidator,
    }
    return target_validator_dict[target_type](target_name)
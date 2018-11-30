from backend.target_validators.abinitio_gmx_validator import AbinitioGMXValidator

def new_validator(target_type):
    target_validator_dict = {
        'ABINITIO_GMX': AbinitioGMXValidator,
    }
    return target_validator_dict[target_type]()
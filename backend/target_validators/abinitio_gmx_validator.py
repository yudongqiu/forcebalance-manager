import os
from forcebalance.molecule import Molecule
from forcebalance.gmxio import edit_mdp
from backend.target_validators.target_validator import TargetValidator

class AbinitioGMXValidator(TargetValidator):
    """ Validator for Force Balance Abinitio_GMX target """
    def __init__(self):
        pass

    def validate(self, file_type, file_uris):
        if file_type == 'gro':
            return self.validate_gro_file(file_uris[0])
        elif file_type == 'qdata':
            return self.validate_qdata_file(file_uris[0])
        elif file_type == 'mdp':
            return self.validate_mdp_file(file_uris[0])
        elif file_type == 'top':
            return self.validate_top_file(file_uris[0])

    def validate_gro_file(self, fileuri):
        """ Validate gro file, this is the first step and we save the molecule object """
        try:
            self.m = Molecule(fileuri)
            ret = {
                'success': True,
                'n_shots': len(self.m),
                'n_atoms': self.m.na,
            }
        except Exception as e:
            ret = {'success': False, 'error': str(e)}
        return ret

    def validate_qdata_file(self, fileuri):
        try:
            m1 = Molecule(fileuri)
            if len(m1) != len(self.m):
                ret = {'success': False, 'error': f'Number of frames {len(m1)} does not match gro file ({len(self.m)})'}
            elif m1.na != self.m.na:
                ret = {'success': False, 'error': f'Number of atoms ({m1.na}) does not match gro file ({self.m.na})'}
            elif len(m1.qm_energies) != len(self.m):
                ret = {'success': False, 'error': f'Number of qm eneriges ({len(m1.qm_energies)}) does not match number of frames ({len(self.m)})'}
            ret = {
                'success': True,
                'n_energies': len(m1.qm_energies),
            }
            # gradiants are optional
            if hasattr(m1, 'qm_grads'):
                if len(m1.qm_grads) != len(self.m):
                    ret = {'success': False, 'error': f'Number of qm gradiants ({len(m1.qm_energies)}) does not match number of frames ({len(self.m)})'}
                else:
                    ret['n_grads'] = len(m1.qm_grads)
        except Exception as e:
            ret = {'success': False, 'error': str(e)}
        return ret

    def validate_mdp_file(self, fileuri):
        try:
            mdp_options = edit_mdp(fin=fileuri)
            ret = {'success': True, 'n_mdp_options': len(mdp_options) }
        except Exception as e:
            ret = {'success': False, 'error': str(e)}
        return ret

    def validate_top_file(self, fileuri):
        ret = {'success': os.path.exists(fileuri)}
        return ret

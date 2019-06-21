import os
import copy
import forcebalance
from forcebalance.molecule import Molecule
from forcebalance.gmxio import edit_mdp
from backend.target_validators.target_validator import TargetValidator

class AbinitioGMXValidator(TargetValidator):
    """ Validator for Force Balance Abinitio_GMX target """
    def save_validate_file(self, file_names, file_datas):
        for fname, fdata in zip(file_names, file_datas):
            with open(fname, 'wb') as byte_f:
                byte_f.write(fdata)

    def validate(self, file_type, file_names, file_datas):
        os.chdir(self._folder)
        # write the uploaded files to self._folder
        self.save_validate_file(file_names, file_datas)
        if file_type == 'gro':
            return self.validate_gro_file(file_names[0])
        elif file_type == 'qdata':
            return self.validate_qdata_file(file_names[0])
        elif file_type == 'mdp':
            return self.validate_mdp_file(file_names[0])
        elif file_type == 'top':
            return self.validate_top_file(file_names[0])

    def validate_gro_file(self, filename):
        """ Validate gro file, this is the first step and we save the molecule object """
        os.chdir(self._folder)
        self.gro_filename = filename
        try:
            m = Molecule(self.gro_filename)
            pdb_string = '\n'.join(m.write_pdb(range(m.na)))
            ret = {
                'success': True,
                'n_shots': len(m),
                'n_atoms': m.na,
                'pdbString': pdb_string,
            }
        except Exception as e:
            print(e)
            ret = {'success': False, 'error': str(e)}
        return ret

    def validate_qdata_file(self, filename):
        os.chdir(self._folder)
        self.qdata_filename = filename
        if self.qdata_filename != 'qdata.txt':
            return {'success': False, 'error': 'Only qdata.txt is recognized by ForceBalance. Please rename file to qdata.txt'}
        assert hasattr(self, 'gro_filename'), 'self.gro_filename does not exist, validate gro file first'
        try:
            m = Molecule(self.gro_filename)
            m1 = Molecule(self.qdata_filename)
            if len(m1) != len(m):
                ret = {'success': False, 'error': f'Number of frames {len(m1)} does not match gro file ({len(m)})'}
            elif m1.na != m.na:
                ret = {'success': False, 'error': f'Number of atoms ({m1.na}) does not match gro file ({m.na})'}
            elif len(m1.qm_energies) != len(m):
                ret = {'success': False, 'error': f'Number of qm eneriges ({len(m1.qm_energies)}) does not match number of frames ({len(m)})'}
            ret = {
                'success': True,
                'n_energies': len(m1.qm_energies),
            }
            # gradiants are optional
            if hasattr(m1, 'qm_grads'):
                if len(m1.qm_grads) != len(m):
                    ret = {'success': False, 'error': f'Number of qm gradiants ({len(m1.qm_energies)}) does not match number of frames ({len(m)})'}
                else:
                    ret['n_grads'] = len(m1.qm_grads)
        except Exception as e:
            print(e)
            ret = {'success': False, 'error': str(e)}
        return ret

    def validate_mdp_file(self, filename):
        os.chdir(self._folder)
        self.mdp_filename = filename
        try:
            mdp_options = edit_mdp(fin=self.mdp_filename)
            ret = {'success': True, 'n_mdp_options': len(mdp_options) }
        except Exception as e:
            print(e)
            ret = {'success': False, 'error': str(e)}
        return ret

    def validate_top_file(self, filename):
        os.chdir(self._folder)
        self.top_filename = filename
        ret = {'success': os.path.exists(self.top_filename)}
        return ret

    def test_create(self, ff):
        gen_opts = copy.deepcopy(forcebalance.parser.gen_opts_defaults)
        gen_opts['root'] = self._tempd
        tgt_opts = copy.deepcopy(forcebalance.parser.tgt_opts_defaults)
        tgt_opts.update({
            'name': self.name,
            'type': 'ABINITIO_GMX',
            'coords': self.gro_filename,
            'gmx_top': self.top_filename,
            'gmx_mdp': self.mdp_filename,
        })
        try:
            os.chdir(self._tempd)
            forcebalance.gmxio.AbInitio_GMX(gen_opts, tgt_opts, ff)
            ret = {'success': True}
        except Exception as e:
            print(e)
            ret = {'success': False, 'error': str(e)}
        return ret

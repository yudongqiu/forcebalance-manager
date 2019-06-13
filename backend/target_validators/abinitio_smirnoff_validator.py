import os
import copy
import forcebalance
from forcebalance.molecule import Molecule
from forcebalance.gmxio import edit_mdp
from backend.target_validators.target_validator import TargetValidator

class AbinitioSMIRNOFFValidator(TargetValidator):
    """ Validator for Force Balance Abinitio_GMX target """
    def save_validate_file(self, file_names, file_datas):
        for fname, fdata in zip(file_names, file_datas):
            with open(fname, 'wb') as byte_f:
                byte_f.write(fdata)

    def validate(self, file_type, file_names, file_datas):
        os.chdir(self._folder)
        # write the uploaded files to self._folder
        self.save_validate_file(file_names, file_datas)
        if file_type == 'coords':
            return self.validate_coords_file(file_names[0])
        elif file_type == 'qdata':
            return self.validate_qdata_file(file_names[0])
        elif file_type == 'mol2':
            return self.validate_mol2_file(file_names[0])
        elif file_type == 'pdb':
            return self.validate_pdb_file(file_names[0])

    def validate_coords_file(self, filename):
        """ Validate coords xyz file, this is the first step and we save the molecule object """
        os.chdir(self._folder)
        self.coords_filename = filename
        try:
            m = Molecule(self.coords_filename)
            # generate pdb string
            if 'resname' not in m.Data:
                m.Data['resname'] = ['MOL'] * m.na
                m.Data['resid'] = [1] * m.na
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
        assert hasattr(self, 'coords_filename'), 'self.coords_filename does not exist, validate coords file first'
        try:
            m = Molecule(self.coords_filename)
            m1 = Molecule(self.qdata_filename)
            if len(m1) != len(m):
                ret = {'success': False, 'error': f'Number of frames {len(m1)} does not match coords file ({len(m)})'}
            elif m1.na != m.na:
                ret = {'success': False, 'error': f'Number of atoms ({m1.na}) does not match coords file ({m.na})'}
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

    def validate_mol2_file(self, filename):
        os.chdir(self._folder)
        self.mol2_filename = filename
        try:
            m = Molecule(self.mol2_filename)
            ret = {'success': True }
        except Exception as e:
            print(e)
            ret = {'success': False, 'error': str(e)}
        return ret

    def validate_pdb_file(self, filename):
        os.chdir(self._folder)
        self.pdb_filename = filename
        try:
            m = Molecule(self.pdb_filename)
            ret = {'success': True }
        except Exception as e:
            print(e)
            ret = {'success': False, 'error': str(e)}
        return ret

    def test_create(self, ff):
        gen_opts = copy.deepcopy(forcebalance.parser.gen_opts_defaults)
        gen_opts['root'] = self._tempd
        tgt_opts = copy.deepcopy(forcebalance.parser.tgt_opts_defaults)
        tgt_opts.update({
            'name': self.name,
            'type': 'ABINITIO_SMIRNOFF',
            'coords': self.coords_filename,
            'mol2': [self.mol2_filename],
            'pdb': self.pdb_filename,
            'openmm_platform': 'Reference',
        })
        try:
            os.chdir(self._tempd)
            forcebalance.smirnoffio.AbInitio_SMIRNOFF(gen_opts, tgt_opts, ff)
            ret = {'success': True}
        except Exception as e:
            print(e)
            ret = {'success': False, 'error': str(e)}
        return ret
